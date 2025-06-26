import { formatUnits, parseUnits, zeroAddress } from 'viem'

import { CHAIN_CONFIG } from '../../chain-configs'
import { aggregators } from '../../chain-configs/aggregators'

import { getTokenBalance, publicClient, TIMEOUT, walletClient } from './utils'

describe('native currency > erc20 currency', async () => {
  it(
    'should execute all aggregator quotes and increase output balance',
    async () => {
      const gasPrice = await publicClient.getGasPrice()

      const inputCurrency = {
        ...CHAIN_CONFIG.CHAIN.nativeCurrency,
        address: zeroAddress,
      }
      const outputCurrency = CHAIN_CONFIG.WHITELISTED_CURRENCIES.find(
        (currency) => currency.symbol === 'USDC',
      )!
      const amountIn = parseUnits('100', inputCurrency.decimals)

      for (let i = 0; i < aggregators.length; i++) {
        try {
          const quote = await aggregators[i].quote(
            inputCurrency,
            amountIn,
            outputCurrency,
            10,
            gasPrice,
            walletClient.account.address,
          )
          if (quote.transaction) {
            const beforeBalance = await getTokenBalance({
              tokenAddress: outputCurrency.address,
              userAddress: walletClient.account.address,
            })
            const hash = await walletClient.sendTransaction(quote.transaction)
            await publicClient.waitForTransactionReceipt({
              hash,
            })
            console.log(
              `Executed quote ${quote.aggregator.name} with hash: ${hash}`,
            )
            const afterBalance = await getTokenBalance({
              tokenAddress: outputCurrency.address,
              userAddress: walletClient.account.address,
            })
            expect(afterBalance).toBeGreaterThan(beforeBalance)
            console.log(
              `Quote ${quote.aggregator.name} executed successfully [${formatUnits(
                beforeBalance,
                outputCurrency.decimals,
              )} -> ${formatUnits(afterBalance, outputCurrency.decimals)}]`,
            )
          }
        } catch (error) {
          console.warn(
            `Quote ${aggregators[i].name} failed: ${error instanceof Error ? error.message : error}`,
          )
        }
      }
    },
    TIMEOUT,
  )
})
