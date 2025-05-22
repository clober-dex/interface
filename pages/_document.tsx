import React from 'react'
import { Head, Html, Main, NextScript } from 'next/document'

import { CHAIN_CONFIG } from '../chain-configs'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="description"
          content={`Join ${CHAIN_CONFIG.DEX_NAME} DEX and Start Trading on a Fully On-chain Order Book. Eliminate Counterparty Risk. Place Limit Orders. Low Transaction Costs Powered by LOBSTER.`}
        />

        {/* <!-- Facebook Meta Tags --> */}
        <meta property="og:url" content={CHAIN_CONFIG.URL} />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content={`Trade | ${CHAIN_CONFIG.DEX_NAME} DEX`}
        />
        <meta
          property="og:description"
          content="Fully On-chain Order Book for EVM"
        />
        <meta
          property="og:image"
          content={`${CHAIN_CONFIG.URL}/chain-configs/twitter-card-v2.png`}
        />
        {/* <!-- Twitter Meta Tags --> */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:site" content={CHAIN_CONFIG.TWITTER_HANDLE} />
        <meta
          property="twitter:title"
          content={`Trade | ${CHAIN_CONFIG.DEX_NAME} DEX`}
        />
        <meta
          property="twitter:description"
          content="Fully On-chain Order Book for EVM."
        />
        <meta
          name="twitter:image"
          content={`${CHAIN_CONFIG.URL}/chain-configs/twitter-card.png`}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
