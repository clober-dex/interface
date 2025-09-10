import React, { useState } from 'react'
import Script from 'next/script'
import dynamic from 'next/dynamic'

import { useChainContext } from '../../contexts/chain-context'
import { Currency } from '../../model/currency'

const TVChartContainer = dynamic(
  () =>
    import('../trading-view-chart-container').then(
      (mod) => mod.TradingViewChartContainer,
    ),
  { ssr: false },
)

export const NativeChartContainer = ({
  baseCurrency,
  quoteCurrency,
  setShowOrderBook,
  totalSupply,
}: {
  baseCurrency: Currency
  quoteCurrency: Currency
  setShowOrderBook?: ((showOrderBook: boolean) => void) | undefined
  totalSupply?: number
}) => {
  const { selectedChain } = useChainContext()
  const [isScriptReady, setIsScriptReady] = useState(false)

  return (
    <>
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onReady={() => {
          setIsScriptReady(true)
        }}
      />
      {isScriptReady ? (
        <TVChartContainer
          chainId={selectedChain.id}
          baseCurrency={baseCurrency}
          quoteCurrency={quoteCurrency}
          setShowOrderBook={setShowOrderBook}
          totalSupply={totalSupply}
        />
      ) : (
        <></>
      )}
    </>
  )
}
