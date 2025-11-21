import { zeroAddress } from 'viem'

import { Aggregator } from '../model/aggregator'
import { AggregatorRouterGateway } from '../model/aggregator/router-gateway'
import { CloberV2Aggregator } from '../model/aggregator/clober-v2'
import { EisenFinanceAggregator } from '../model/aggregator/eisenfinance'

import { CHAIN_CONFIG } from './index'

export const aggregators: Aggregator[] = [
  new AggregatorRouterGateway(
    CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
    CHAIN_CONFIG.CHAIN,
    new CloberV2Aggregator(zeroAddress, CHAIN_CONFIG.CHAIN),
  ),
  new AggregatorRouterGateway(
    CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
    CHAIN_CONFIG.CHAIN,
    new EisenFinanceAggregator(zeroAddress, CHAIN_CONFIG.CHAIN),
  ),
]
