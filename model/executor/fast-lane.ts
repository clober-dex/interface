import { Transaction } from '@clober/v2-sdk'
import { createPublicClient, Hex, http, PublicClient, WalletClient } from 'viem'
import axios from 'axios'

import { Chain } from '../chain'
import { CHAIN_CONFIG } from '../../chain-configs'

interface AtlasResponse {
  from: Hex
  to: Hex
  value: Hex
  data: Hex
  gas: Hex
  maxFeePerGas: Hex
}

export class FastLaneExecutor {
  public readonly name = 'FastLane'
  public readonly chain: Chain
  public readonly contract: `0x${string}`
  private publicClient: PublicClient
  private readonly TIMEOUT = 5000

  constructor(contract: `0x${string}`, chain: Chain) {
    this.contract = contract
    this.chain = chain
    this.publicClient = createPublicClient({
      chain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
  }

  public async sendTransaction(
    transaction: Transaction,
    walletClient: WalletClient,
    timeout?: number,
  ): Promise<`0x${string}`> {
    const { maxFeePerGas } = await this.publicClient.estimateFeesPerGas()
    const payload = {
      jsonrpc: '2.0',
      method: 'atlas_sendUnsignedTransaction',
      params: [
        {
          transaction: {
            chainId: `0x${this.chain.id.toString(16)}`,
            from: transaction.from,
            to: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES
              .AggregatorRouterGateway,
            value: `0x${transaction.value.toString(16)}`,
            maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
            data: transaction.data,
          },
          refundRecipient: '0xEb386e036ffE592d982d1B0A835E25b11361C9cA',
          refundPercent: `0x${50n.toString(16)}`,
          bidTokenIsOutputToken: false,
        },
      ],
      id: 1,
    }

    try {
      const {
        data: { result },
      } = (await axios.post(
        'https://auctioneer-fra.fastlane-labs.xyz',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: timeout || this.TIMEOUT,
        },
      )) as {
        data: { result: AtlasResponse }
      }
      return walletClient.sendTransaction({
        to: result.to,
        value: BigInt(result.value),
        gas: BigInt(result.gas),
        maxFeePerGas: BigInt(result.maxFeePerGas),
        data: result.data,
        account: walletClient.account!,
        chain: this.chain,
      })
    } catch (e) {
      throw new Error(
        `Failed to send transaction via FastLane: ${e instanceof Error ? e.message : String(e)}`,
      )
    }
  }
}
