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

import { CHAIN_CONFIG } from '../../../chain-configs'
import { aggregators } from '../../../chain-configs/aggregators'

function validateQueryParams(query: NextApiRequest['query']) {
  const {
    inputTokenAddress,
    outputTokenAddress,
    amountIn,
    slippageLimitPercent,
    userAddress,
  } = query

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

  return {
    inputTokenAddress: inputTokenAddress!,
    outputTokenAddress: outputTokenAddress!,
    amountIn: BigInt(amountIn!),
    slippageLimitPercent: Number(slippageLimitPercent!),
    userAddress: userAddress ? getAddress(userAddress as string) : undefined,
  }
}

async function getTokenInfo(
  inputTokenAddress: `0x${string}`,
  outputTokenAddress: `0x${string}`,
): Promise<{
  inputCurrency: Currency
  outputCurrency: Currency
  gasPrice: bigint
}> {
  const publicClient = createPublicClient({
    chain: CHAIN_CONFIG.CHAIN,
    transport: http(CHAIN_CONFIG.RPC_URL),
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

  return {
    inputCurrency,
    outputCurrency,
    gasPrice,
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
    } = validated

    const { inputCurrency, outputCurrency, gasPrice } = await getTokenInfo(
      inputTokenAddress,
      outputTokenAddress,
    )

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
    res.status(400).json({ error: error.message })
    return
  }
}
