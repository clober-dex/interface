import { getAddress, zeroAddress } from 'viem'
import { monadTestnet } from 'viem/chains'

import { Aggregator } from '../model/aggregator'
import { OpenOceanAggregator } from '../model/aggregator/openocean'
import { CloberV2Aggregator } from '../model/aggregator/clober-v2'
import { AggregatorRouterGateway } from '../model/aggregator/router-gateway'
import { MadhouseAggregator } from '../model/aggregator/madhouse'
import { MonorailAggregator } from '../model/aggregator/monorail'

export const aggregators: Aggregator[] = [
  // new CloberV2Aggregator(
  //   getContractAddresses({ chainId: CHAIN_IDS.MONAD_TESTNET }).Controller,
  //   monadTestnet,
  // ),
  // new MonorailAggregator(
  //   getAddress('0x11133460f102c5de431f7749c8bc2b7c172568e1'),
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
    new MadhouseAggregator(zeroAddress, monadTestnet),
  ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    new MonorailAggregator(zeroAddress, monadTestnet),
  ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    new OpenOceanAggregator(zeroAddress, monadTestnet),
  ),
]
