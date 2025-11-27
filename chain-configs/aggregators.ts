import { zeroAddress } from 'viem'

import { Aggregator } from '../model/aggregator'
import { AggregatorRouterGateway } from '../model/aggregator/router-gateway'
import { CloberV2Aggregator } from '../model/aggregator/clober-v2'
import { EisenFinanceAggregator } from '../model/aggregator/eisenfinance'
import { MadhouseAggregator } from '../model/aggregator/madhouse'
import { MonorailAggregator } from '../model/aggregator/monorail'
import { KyberswapAggregator } from '../model/aggregator/kyberswap'
import { OpenOceanAggregator } from '../model/aggregator/openocean'
import { FlyAggregator } from '../model/aggregator/fly'
import { ZeroXAggregator } from '../model/aggregator/0x'
import { KuruAggregator } from '../model/aggregator/kuru'

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
  new AggregatorRouterGateway(
    CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
    CHAIN_CONFIG.CHAIN,
    new MadhouseAggregator(zeroAddress, CHAIN_CONFIG.CHAIN),
  ),
  new AggregatorRouterGateway(
    CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
    CHAIN_CONFIG.CHAIN,
    new KyberswapAggregator(zeroAddress, CHAIN_CONFIG.CHAIN),
  ),
  new AggregatorRouterGateway(
    CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
    CHAIN_CONFIG.CHAIN,
    new MonorailAggregator(zeroAddress, CHAIN_CONFIG.CHAIN),
  ),
  new AggregatorRouterGateway(
    CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
    CHAIN_CONFIG.CHAIN,
    new OpenOceanAggregator(zeroAddress, CHAIN_CONFIG.CHAIN),
  ),
  new AggregatorRouterGateway(
    CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
    CHAIN_CONFIG.CHAIN,
    new FlyAggregator(zeroAddress, CHAIN_CONFIG.CHAIN),
  ),
  new AggregatorRouterGateway(
    CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
    CHAIN_CONFIG.CHAIN,
    new ZeroXAggregator(zeroAddress, CHAIN_CONFIG.CHAIN),
  ),
  new AggregatorRouterGateway(
    CHAIN_CONFIG.EXTERNAL_CONTRACT_ADDRESSES.AggregatorRouterGateway,
    CHAIN_CONFIG.CHAIN,
    new KuruAggregator(zeroAddress, CHAIN_CONFIG.CHAIN),
  ),
]
