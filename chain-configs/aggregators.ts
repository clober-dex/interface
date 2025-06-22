import { getAddress, zeroAddress } from 'viem'
import { monadTestnet } from 'viem/chains'

import { Aggregator } from '../model/aggregator'
import { OpenOceanAggregator } from '../model/aggregator/openocean'
import { CloberV2Aggregator } from '../model/aggregator/clober-v2'
import { AggregatorRouterGateway } from '../model/aggregator/router-gateway'
import { MadhouseAggregator } from '../model/aggregator/madhouse'
import { MonorailAggregator } from '../model/aggregator/monorail'
import { EisenFinanceAggregator } from '../model/aggregator/eisenfinance'

export const aggregators: Aggregator[] = [
  // new CloberV2Aggregator(
  //   getContractAddresses({ chainId: CHAIN_IDS.MONAD_TESTNET }).Controller,
  //   monadTestnet,
  // ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    new CloberV2Aggregator(zeroAddress, monadTestnet),
  ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    // 0x1e538356d3cfe7fa04696a92515add4a895ecb65
    new MadhouseAggregator(zeroAddress, monadTestnet),
  ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    // 0x11133460f102c5de431f7749c8bc2b7c172568e1
    new MonorailAggregator(zeroAddress, monadTestnet),
  ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    // 0x6352a56caadC4F1E25CD6c75970Fa768A3304e64
    new OpenOceanAggregator(zeroAddress, monadTestnet),
  ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    // 0xfC985A550f7c29EC5266E6591b029FE2509E1D0d
    new EisenFinanceAggregator(zeroAddress, monadTestnet),
  ),
]
