import { monadTestnet } from 'viem/chains'

import { Executor } from '../model/executor'
import { FastLaneExecutor } from '../model/executor/fast-lane'

export const executors: Executor[] = [new FastLaneExecutor(monadTestnet)]
