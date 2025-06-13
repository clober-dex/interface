import { CHAIN_IDS, getContractAddresses } from '@clober/v2-sdk'
import { getAddress } from 'viem'
import { monadTestnet } from 'viem/chains'

import { Aggregator } from '../model/aggregator'
import { OpenOceanAggregator } from '../model/aggregator/openocean'
import { CloberV2Aggregator } from '../model/aggregator/clober-v2'
import { AggregatorRouterGateway } from '../model/aggregator/router-gateway'
import { MonorailAggregator } from '../model/aggregator/monorail'
import { MadhouseAggregator } from '../model/aggregator/madhouse'

export const aggregators: Aggregator[] = [
  // new CloberV2Aggregator(
  //   getContractAddresses({ chainId: CHAIN_IDS.MONAD_TESTNET }).Controller,
  //   monadTestnet,
  // ),
  // new OpenOceanAggregator(
  //   getAddress('0x6352a56caadC4F1E25CD6c75970Fa768A3304e64'),
  //   monadTestnet,
  // ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    new CloberV2Aggregator(
      getContractAddresses({ chainId: CHAIN_IDS.MONAD_TESTNET }).Controller,
      monadTestnet,
    ),
  ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    new MadhouseAggregator(
      getAddress('0x1e538356d3cfe7fa04696a92515add4a895ecb65'),
      monadTestnet,
    ),
  ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    new MonorailAggregator(
      getAddress('0x7B5dF408da2356e9Eecda0492104E758A2B6913d'),
      monadTestnet,
    ),
  ),
  new AggregatorRouterGateway(
    getAddress('0xfD845859628946B317A78A9250DA251114FbD846'),
    monadTestnet,
    new OpenOceanAggregator(
      getAddress('0x6352a56caadC4F1E25CD6c75970Fa768A3304e64'),
      monadTestnet,
    ),
  ),
]
