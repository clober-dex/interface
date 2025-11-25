import { getAddress } from 'viem'
import { monad } from 'viem/chains'

import { Executor } from '../model/executor'
import { FastLaneExecutor } from '../model/executor/fast-lane'

export const executors: Executor[] = [
  new FastLaneExecutor(
    getAddress('0x2DA28fedc4643c787CB5c5e84fa6AaDb596875E8'),
    monad,
  ),
]
