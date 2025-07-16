import { monadTestnet } from 'viem/chains'
import { getAddress } from 'viem'

import { Executor } from '../model/executor'
import { FastLaneExecutor } from '../model/executor/fast-lane'

export const executors: Executor[] = [
  new FastLaneExecutor(
    getAddress('0x4a730A56344873FB28f7C3d65A67Fea56f5e0F46'),
    monadTestnet,
  ),
]
