import { CHAIN_IDS, getContractAddresses } from '@clober/v2-sdk'

import { Aggregator } from '../model/aggregator'
import { CloberV2Aggregator } from '../model/aggregator/clober-v2'

import { giwaSepolia } from './giwa-sepolia'

export const aggregators: Aggregator[] = [
  new CloberV2Aggregator(
    getContractAddresses({ chainId: CHAIN_IDS.GIWA_SEPOLIA }).Controller,
    giwaSepolia,
  ),
]
