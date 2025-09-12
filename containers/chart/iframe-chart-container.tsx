import React, { useMemo, useState } from 'react'
import { CHAIN_IDS } from '@clober/v2-sdk'

const CHAIN_LIST = [
  {
    networkId: 1088,
    name: 'metis',
  },
  {
    networkId: 999,
    name: 'hyperevm',
  },
  {
    networkId: 1923,
    name: 'swellchain',
  },
  {
    networkId: 5000,
    name: 'mantle',
  },
  {
    networkId: 8217,
    name: 'klaytn',
  },
  {
    networkId: 98866,
    name: 'plume',
  },
  {
    networkId: 54176,
    name: 'over-protocol',
  },
  {
    networkId: 204,
    name: 'opbnb',
  },
  {
    networkId: 153153,
    name: 'odyssey',
  },
  {
    networkId: 888,
    name: 'wanchain',
  },
  {
    networkId: 109,
    name: 'shibarium',
  },
  {
    networkId: 40,
    name: 'telos',
  },
  {
    networkId: 48900,
    name: 'zircuit',
  },
  {
    networkId: 80001,
    name: 'mumbai',
  },
  {
    networkId: 42220,
    name: 'celo',
  },
  {
    networkId: 9001,
    name: 'evmos',
  },
  {
    networkId: 84532,
    name: 'base-sepolia',
  },
  {
    networkId: 2000,
    name: 'dogechain',
  },
  {
    networkId: 49705,
    name: 'Aptos',
  },
  {
    networkId: 2021,
    name: 'Saigon Chain',
  },
  {
    networkId: 420042,
    name: 'vector',
  },
  {
    networkId: 1480,
    name: 'vana',
  },
  {
    networkId: 50104,
    name: 'sophon',
  },
  {
    networkId: 66,
    name: 'oec',
  },
  {
    networkId: 1313161554,
    name: 'aurora',
  },
  {
    networkId: 383353,
    name: 'cheesechain',
  },
  {
    networkId: 106,
    name: 'velas',
  },
  {
    networkId: 169,
    name: 'manta',
  },
  {
    networkId: 1,
    name: 'eth',
  },
  {
    networkId: 11155111,
    name: 'sepolia',
  },
  {
    networkId: 42170,
    name: 'nova',
  },
  {
    networkId: 88888,
    name: 'chiliz',
  },
  {
    networkId: 42262,
    name: 'oasis',
  },
  {
    networkId: 531,
    name: 'sei',
  },
  {
    networkId: 59144,
    name: 'linea',
  },
  {
    networkId: 98865,
    name: 'plumelegacy',
  },
  {
    networkId: 39797,
    name: 'energi',
  },
  {
    networkId: 4321,
    name: 'echos',
  },
  {
    networkId: 2001,
    name: 'milkomeda',
  },
  {
    networkId: 168587773,
    name: 'blast',
  },
  {
    networkId: 80085,
    name: 'berachain artio',
  },
  {
    networkId: 80084,
    name: 'berachainbartio',
  },
  {
    networkId: 11124,
    name: 'abstract-testnet',
  },
  {
    networkId: 61166,
    name: 'treasure',
  },
  {
    networkId: 130,
    name: 'unichain',
  },
  {
    networkId: 534352,
    name: 'Scroll',
  },
  {
    networkId: 324,
    name: 'zksync',
  },
  {
    networkId: 82,
    name: 'meter',
  },
  {
    networkId: 137,
    name: 'matic',
  },
  {
    networkId: 668668,
    name: 'conwai',
  },
  {
    networkId: 8453,
    name: 'base',
  },
  {
    networkId: 24,
    name: 'kardia',
  },
  {
    networkId: 246,
    name: 'energyweb',
  },
  {
    networkId: 10000,
    name: 'smartbch',
  },
  {
    networkId: 10143,
    name: 'monad_testnet',
  },
  {
    networkId: 3000,
    name: 'echelon',
  },
  {
    networkId: 146,
    name: 'sonic',
  },
  {
    networkId: 250,
    name: 'fantom',
  },
  {
    networkId: 81457,
    name: 'blastmainnet',
  },
  {
    networkId: 1514,
    name: 'story',
  },
  {
    networkId: 1101,
    name: 'polygonzkevm',
  },
  {
    networkId: 333000333,
    name: 'meld',
  },
  {
    networkId: 128,
    name: 'heco',
  },
  {
    networkId: 713715,
    name: 'sei-arctic',
  },
  {
    networkId: 5,
    name: 'goerli',
  },
  {
    networkId: 2020,
    name: 'roninchain',
  },
  {
    networkId: 34443,
    name: 'mode',
  },
  {
    networkId: 333999,
    name: 'polis',
  },
  {
    networkId: 336,
    name: 'shiden',
  },
  {
    networkId: 4689,
    name: 'iotex',
  },
  {
    networkId: 100,
    name: 'xdai',
  },
  {
    networkId: 1284,
    name: 'moonbeam',
  },
  {
    networkId: 428962,
    name: 'yomi',
  },
  {
    networkId: 2741,
    name: 'abstract',
  },
  {
    networkId: 111188,
    name: 're.al',
  },
  {
    networkId: 101,
    name: 'Sui',
  },
  {
    networkId: 728126428,
    name: 'tron',
  },
  {
    networkId: 1285,
    name: 'moonriver',
  },
  {
    networkId: 1992,
    name: 'sanko-sepolia',
  },
  {
    networkId: 57420037,
    name: 'Starknet',
  },
  {
    networkId: 666666666,
    name: 'degenchain',
  },
  {
    networkId: 5112,
    name: 'ham',
  },
  {
    networkId: 1399811149,
    name: 'solana',
  },
  {
    networkId: 480,
    name: 'worldchain',
  },
  {
    networkId: 55,
    name: 'zyx',
  },
  {
    networkId: 660279,
    name: 'xai',
  },
  {
    networkId: 7777777,
    name: 'zora',
  },
  {
    networkId: 57073,
    name: 'ink',
  },
  {
    networkId: 56,
    name: 'bsc',
  },
  {
    networkId: 70,
    name: 'hsc',
  },
  {
    networkId: 80094,
    name: 'berachain',
  },
  {
    networkId: 43114,
    name: 'avalanche',
  },
  {
    networkId: 288,
    name: 'boba',
  },
  {
    networkId: 20,
    name: 'elastos',
  },
  {
    networkId: 1666600000,
    name: 'harmony',
  },
  {
    networkId: 53935,
    name: 'dfk',
  },
  {
    networkId: 1116,
    name: 'core',
  },
  {
    networkId: 13371,
    name: 'immutable',
  },
  {
    networkId: 820,
    name: 'callisto',
  },
  {
    networkId: 1513,
    name: 'story-iliad',
  },
  {
    networkId: 1996,
    name: 'sanko',
  },
  {
    networkId: 369,
    name: 'pulsechain',
  },
  {
    networkId: 321,
    name: 'kcc',
  },
  {
    networkId: 42161,
    name: 'arbitrum',
  },
  {
    networkId: 25,
    name: 'cronos',
  },
  {
    networkId: 33139,
    name: 'apechain',
  },
  {
    networkId: 592,
    name: 'astar',
  },
  {
    networkId: 55244,
    name: 'superposition',
  },
  {
    networkId: 10,
    name: 'optimism',
  },
  {
    networkId: 57,
    name: 'syscoin',
  },
  {
    networkId: 80089,
    name: 'berachain_old',
  },
  {
    networkId: 1030,
    name: 'conflux',
  },
  {
    networkId: 545,
    name: 'flow-evm-test',
  },
  {
    networkId: 7700,
    name: 'canto',
  },
  {
    networkId: 747,
    name: 'flow-evm',
  },
  {
    networkId: 122,
    name: 'fuse',
  },
]

export const IframeChartContainer = ({
  pairAddress,
  chainId,
}: {
  pairAddress: `0x${string}`
  chainId: CHAIN_IDS
}) => {
  const [fullscreen, setFullscreen] = useState(false)
  const chainName = useMemo(() => {
    const chain = CHAIN_LIST.find((c) => c.networkId === chainId)
    return chain ? chain.name : 'unknown'
  }, [chainId])

  return (
    <>
      {fullscreen && (
        <div className="flex flex-col rounded-2xl bg-[#171b24] overflow-hidden min-h-[280px] w-full md:w-[480px] xl:w-[740px] xl:outline xl:outline-1 xl:outline-offset-[-1px] xl:outline-[#272930]" />
      )}
      <div
        className={`xl:outline xl:outline-1 xl:outline-offset-[-1px] xl:outline-[#272930] flex flex-col bg-[#171b24] overflow-hidden ${
          fullscreen
            ? 'w-full fixed left-0 top-0 right-0 bottom-0 z-10'
            : 'rounded-2xl min-h-[280px] h-[481px] xl:h-full w-full md:w-[480px] xl:w-[740px] z-[0]'
        }`}
      >
        <div className="left-0 top-0 right-20 z-20 flex items-center justify-end gap-2 px-4 py-2">
          <div className="w-full mr-auto sm:ml-auto flex">
            <button
              className="ml-auto p-0 pl-2 bg-transparent"
              onClick={() => setFullscreen((x) => !x)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="block w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] stroke-gray-500 hover:stroke-gray-200"
              >
                <path
                  d="M11 2H14V5"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
                <path
                  d="M10 6L13 3"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 14H2V11"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
                <path
                  d="M6 10L3 13"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <iframe
          height="100%"
          width="100%"
          id="defined-embed"
          title="Defined Embed"
          src={`https://www.defined.fi/${chainName}/${pairAddress}/embed?quoteToken=token0&hideTxTable=1&hideSidebar=1&hideChart=0&hideChartEmptyBars=1&chartSmoothing=1&embedColorMode=DEFAULT&quoteCurrency=TOKEN`}
          frameBorder="0"
          allow="clipboard-write"
        />
      </div>
    </>
  )
}
