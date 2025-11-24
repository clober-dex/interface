import { NextApiRequest, NextApiResponse } from 'next'
import {
  createPublicClient,
  erc20Abi,
  getAddress,
  http,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { Currency } from '@clober/v2-sdk'

import { CHAIN_CONFIG } from '../../../../../chain-configs'
import { aggregators } from '../../../../../chain-configs/aggregators'

function validateQueryParams(query: NextApiRequest['query']) {
  const {
    inputTokenAddress,
    outputTokenAddress,
    amountIn,
    slippageLimitPercent,
    userAddress,
    chainId,
    skipUserValidation,
  } = query

  if (
    !chainId ||
    typeof chainId !== 'string' ||
    chainId !== CHAIN_CONFIG.CHAIN.id.toString()
  ) {
    throw new Error('Invalid chainId')
  }

  if (
    !inputTokenAddress ||
    typeof inputTokenAddress !== 'string' ||
    !isAddress(inputTokenAddress)
  ) {
    throw new Error('Invalid inputTokenAddress')
  }

  if (
    !outputTokenAddress ||
    typeof outputTokenAddress !== 'string' ||
    !isAddress(outputTokenAddress)
  ) {
    throw new Error('Invalid outputTokenAddress')
  }

  if (!amountIn || typeof amountIn !== 'string' || isNaN(Number(amountIn))) {
    throw new Error('Invalid amountIn')
  }

  if (
    !slippageLimitPercent ||
    typeof slippageLimitPercent !== 'string' ||
    isNaN(Number(slippageLimitPercent))
  ) {
    throw new Error('Invalid slippageLimitPercent')
  }

  if (userAddress && !isAddress(userAddress as string)) {
    throw new Error('Invalid userAddress')
  }

  if (
    skipUserValidation &&
    skipUserValidation !== 'true' &&
    skipUserValidation !== 'false'
  ) {
    throw new Error('Invalid skipUserValidation')
  }

  if (isAddressEqual(inputTokenAddress, outputTokenAddress)) {
    throw new Error(
      'Invalid inputTokenAddress and outputTokenAddress: they must be different addresses',
    )
  }

  return {
    inputTokenAddress: inputTokenAddress!,
    outputTokenAddress: outputTokenAddress!,
    amountIn: BigInt(amountIn!),
    slippageLimitPercent: Number(slippageLimitPercent!),
    userAddress: userAddress ? getAddress(userAddress as string) : undefined,
    skipUserValidation: skipUserValidation === 'true',
  }
}

async function getSwapContext(
  inputTokenAddress: `0x${string}`,
  outputTokenAddress: `0x${string}`,
  userAddress?: `0x${string}`,
): Promise<{
  inputCurrency: Currency
  outputCurrency: Currency
  gasPrice: bigint
  inputCurrencyBalance: bigint
  inputCurrencyAllowance: bigint
}> {
  const publicClient = createPublicClient({
    chain: CHAIN_CONFIG.CHAIN,
    transport: http(),
  })
  const isInputNative = isAddressEqual(inputTokenAddress, zeroAddress)
  const isOutputNative = isAddressEqual(outputTokenAddress, zeroAddress)
  const native = CHAIN_CONFIG.CHAIN.nativeCurrency

  const contracts = []

  if (!isInputNative) {
    contracts.push(
      {
        address: inputTokenAddress,
        abi: erc20Abi,
        functionName: 'name',
      },
      {
        address: inputTokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      },
      {
        address: inputTokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    )
  }
  if (!isOutputNative) {
    contracts.push(
      {
        address: outputTokenAddress,
        abi: erc20Abi,
        functionName: 'name',
      },
      {
        address: outputTokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      },
      {
        address: outputTokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    )
  }

  if (userAddress) {
    if (isInputNative) {
      if (!CHAIN_CONFIG.CHAIN.contracts?.multicall3?.address) {
        throw new Error(
          'Multicall3 contract address is not defined in chain config',
        )
      }

      // check native currency balance
      contracts.push({
        address: CHAIN_CONFIG.CHAIN.contracts.multicall3.address,
        abi: [
          {
            inputs: [
              { internalType: 'address', name: 'addr', type: 'address' },
            ],
            name: 'getEthBalance',
            outputs: [
              { internalType: 'uint256', name: 'balance', type: 'uint256' },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ] as const,
        functionName: 'getEthBalance',
        args: [userAddress],
      })
    } else {
      // check erc20 balance and allowance
      contracts.push(
        {
          address: inputTokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress],
        },
        {
          address: inputTokenAddress,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [
            userAddress,
            CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
          ],
        },
      )
    }
  }

  const [gasPrice, results] = await Promise.all([
    publicClient.getGasPrice(),
    contracts.length > 0
      ? publicClient.multicall({ contracts })
      : Promise.resolve([]),
  ])

  let i = 0
  const inputCurrency = isInputNative
    ? { ...native, address: zeroAddress }
    : {
        address: inputTokenAddress,
        name: results[i++].result! as string,
        symbol: results[i++].result! as string,
        decimals: Number(results[i++].result!),
      }

  const outputCurrency = isOutputNative
    ? {
        ...native,
        address: zeroAddress,
      }
    : {
        address: outputTokenAddress,
        name: results[i++].result! as string,
        symbol: results[i++].result! as string,
        decimals: Number(results[i++].result!),
      }

  let inputCurrencyBalance = 0n
  let inputCurrencyAllowance = 0n
  if (userAddress) {
    inputCurrencyBalance = BigInt(
      results[i++].result! as number | bigint | string,
    )
    if (isInputNative) {
      inputCurrencyAllowance = 2n ** 256n - 1n
    } else {
      inputCurrencyAllowance = BigInt(
        results[i++].result! as number | bigint | string,
      )
    }
  }

  return {
    inputCurrency,
    outputCurrency,
    gasPrice,
    inputCurrencyBalance,
    inputCurrencyAllowance,
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  try {
    const validated = validateQueryParams(req.query)

    const {
      inputTokenAddress,
      outputTokenAddress,
      amountIn,
      slippageLimitPercent,
      userAddress,
      skipUserValidation,
    } = validated

    const {
      inputCurrency,
      outputCurrency,
      gasPrice,
      inputCurrencyBalance,
      inputCurrencyAllowance,
    } = await getSwapContext(inputTokenAddress, outputTokenAddress, userAddress)
    if (!skipUserValidation && userAddress && inputCurrencyBalance < amountIn) {
      res
        .status(422)
        .json({ code: 'INSUFFICIENT_BALANCE', error: 'Insufficient balance' })
      return
    }
    if (
      !skipUserValidation &&
      userAddress &&
      inputCurrencyAllowance < amountIn
    ) {
      res.status(422).json({
        code: 'INSUFFICIENT_ALLOWANCE',
        error: `Please approve spender ${CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway} first`,
      })
      return
    }

    const results = (
      await Promise.allSettled(
        aggregators.map(async (aggregator) =>
          aggregator.quote(
            inputCurrency,
            amountIn,
            outputCurrency,
            slippageLimitPercent,
            gasPrice,
            userAddress,
            1000,
            false,
          ),
        ),
      )
    )
      .map((result) =>
        result.status === 'fulfilled' ? result.value : undefined,
      )
      .filter(
        (quote): quote is any => quote !== undefined && quote.amountOut > 0n,
      )
      .map((quote) => ({
        amountOut: quote.amountOut.toString(),
        aggregator: quote.aggregator.name,
        transaction:
          quote.transaction && userAddress
            ? {
                data: quote.transaction.data,
                gas: quote.transaction.gas.toString(),
                gasPrice: quote.transaction.gasPrice.toString(),
                value: quote.transaction.value.toString(),
                to: quote.transaction.to,
                from: userAddress,
              }
            : null,
        executionMilliseconds: quote.executionMilliseconds,
      }))
      .sort((a, b) => Number(b.amountOut - a.amountOut))

    res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate=1')
    res.status(200).json({
      bestQuote: results.length > 0 ? results[0] : null,
      allQuotes: results,
    })
  } catch (error: any) {
    console.error('Error processing quote request:', error)
    if (error.message?.startsWith('Invalid')) {
      res.status(200).json({ code: 'BAD_REQUEST', error: error.message })
      return
    }

    res
      .status(500)
      .json({ code: 'INTERNAL_SERVER_ERROR', error: error.message })
    return
  }
}
