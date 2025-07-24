import { monadTestnet } from 'viem/chains'
import { getAddress } from 'viem'

import { Executor } from '../model/executor'
import { FastLaneExecutor } from '../model/executor/fast-lane'

export const executors: Executor[] = [
  new FastLaneExecutor(
    getAddress('0xbB010Cb7e71D44d7323aE1C267B333A48D05907C'),
    monadTestnet,
  ),
]
