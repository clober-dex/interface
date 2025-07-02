import { Transaction } from '@clober/v2-sdk'
import { createPublicClient, http, PublicClient } from 'viem'
import axios from 'axios'

import { Chain } from '../chain'
import { CHAIN_CONFIG } from '../../chain-configs'

export class FastLaneExecutor {
  public readonly name = 'FastLane'
  public readonly chain: Chain
  private publicClient: PublicClient
  private readonly TIMEOUT = 5000

  constructor(chain: Chain) {
    this.chain = chain
    this.publicClient = createPublicClient({
      chain,
      transport: http(CHAIN_CONFIG.RPC_URL),
    })
  }

  public async sendTransaction(
    transaction: Transaction,
    timeout?: number,
  ): Promise<void> {
    const payload = {
      jsonrpc: '2.0',
      method: 'atlas_sendUnsignedTransaction',
      params: [
        {
          transaction: {
            chainId: this.chain.id,
            from: transaction.from,
            to: CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES
              .AggregatorRouterGateway, //NOT ATLAS - use same tx details as a normal protocol swap
            value: transaction.value,
            data: transaction.data,
          },
          refundRecipient: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
          refundPercent: 50,
          bidTokenIsOutputToken: false,
        },
      ],
      id: 1,
    }

    try {
      const response = await axios.post(
        'https://auctioneer-fra.fastlane-labs.xyz',
        {
          payload,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: timeout || this.TIMEOUT,
        },
      )
      console.log('Transaction sent successfully:', response.data)
    } catch (e) {
      console.error('Failed to send transaction:', e)
    }
  }
}
