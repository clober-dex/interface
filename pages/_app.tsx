import React, { useCallback, useEffect, useRef, useState } from 'react'
import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import Head from 'next/head'
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query'
import type { AppProps } from 'next/app'
import { WagmiProvider } from 'wagmi'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Script from 'next/script'

import HeaderContainer from '../containers/header-container'
import { ChainProvider } from '../contexts/chain-context'
import { MarketProvider } from '../contexts/trade/market-context'
import {
  TransactionProvider,
  useTransactionContext,
} from '../contexts/transaction-context'
import { OpenOrderProvider } from '../contexts/trade/open-order-context'
import { LimitContractProvider } from '../contexts/trade/limit-contract-context'
import Panel from '../components/panel'
import ErrorBoundary from '../components/error-boundary'
import { CurrencyProvider } from '../contexts/currency-context'
import { TradeProvider } from '../contexts/trade/trade-context'
import { SwapContractProvider } from '../contexts/trade/swap-contract-context'
import { PoolProvider } from '../contexts/pool/pool-context'
import { PoolContractProvider } from '../contexts/pool/pool-contract-context'
import { FuturesProvider } from '../contexts/futures/futures-context'
import { FuturesContractProvider } from '../contexts/futures/futures-contract-context'
import { CHAIN_CONFIG, getClientConfig } from '../chain-configs'
import Sidebar from '../components/sidebar'
import { BlockNumberWidget } from '../components/block-number-widget'

const CacheProvider = ({ children }: React.PropsWithChildren) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    localStorage.removeItem('wagmi.cache')
  }, [queryClient])

  return <>{children}</>
}

const queryClient = new QueryClient()

const NexusProvider = dynamic(() => import('../contexts/nexus-context'), {
  ssr: false,
})
const WalletProvider = ({ children }: React.PropsWithChildren) => {
  const [clientReady, setClientReady] = useState(false)
  const [clientConfig, setClientConfig] = useState<any | null>(null)

  useEffect(() => {
    const config = getClientConfig()
    if (config) {
      setClientConfig(config)
      setClientReady(true)
    }
  }, [])

  if (!clientReady || !clientConfig) {
    return null
  }

  return (
    <WagmiProvider config={clientConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={CHAIN_CONFIG.CHAIN}
          modalSize="compact"
          theme={darkTheme()}
        >
          <CacheProvider>
            <NexusProvider>{children}</NexusProvider>
          </CacheProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

const TradeProvidersWrapper = ({ children }: React.PropsWithChildren) => {
  return (
    <OpenOrderProvider>
      <LimitContractProvider>
        <SwapContractProvider>
          <TradeProvider>
            <MarketProvider>{children}</MarketProvider>
          </TradeProvider>
        </SwapContractProvider>
      </LimitContractProvider>
    </OpenOrderProvider>
  )
}

const PoolProvidersWrapper = ({ children }: React.PropsWithChildren) => {
  return (
    <PoolProvider>
      <PoolContractProvider>{children}</PoolContractProvider>
    </PoolProvider>
  )
}

const FuturesProvidersWrapper = ({ children }: React.PropsWithChildren) => {
  return (
    <FuturesProvider>
      <FuturesContractProvider>{children}</FuturesContractProvider>
    </FuturesProvider>
  )
}

const PanelWrapper = ({
  open,
  setOpen,
  children,
}: {
  open: boolean
  setOpen: (open: boolean) => void
} & React.PropsWithChildren) => {
  const router = useRouter()

  return (
    <Panel open={open} setOpen={setOpen} router={router}>
      {children}
    </Panel>
  )
}

const SidebarWrapper = ({ children }: React.PropsWithChildren) => {
  const router = useRouter()
  return <Sidebar router={router}>{children}</Sidebar>
}

const FooterWrapper = () => {
  const { lastIndexedBlockNumber } = useTransactionContext()
  return <BlockNumberWidget latestBlockNumber={lastIndexedBlockNumber} />
}

function App({ Component, pageProps }: AppProps) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const router = useRouter()
  const isFirstPageViewSent = useRef(false)

  const handlePopState = useCallback(async () => {
    if (history.length > 1) {
      setHistory((previous) => previous.slice(0, previous.length - 1))
      router.push(history[history.length - 2])
    }
  }, [history, router])

  useEffect(() => {
    setHistory((previous) => [...previous, router.asPath])
  }, [router.asPath])

  useEffect(() => {
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handlePopState])

  useEffect(() => {
    const sendPageView = (pathname: string, search: string) => {
      const urlParams = new URLSearchParams(search || '')
      const utm_source = urlParams.get('utm_source') || undefined
      const utm_medium = urlParams.get('utm_medium') || undefined
      const utm_campaign = urlParams.get('utm_campaign') || undefined

      // @ts-ignore
      window.gtag?.('config', CHAIN_CONFIG.GOOGLE_ANALYTICS_TRACKING_ID, {
        page_path: pathname,
        campaign_source: utm_source,
        campaign_medium: utm_medium,
        campaign_name: utm_campaign,
      })
    }

    const initialPathname = window.location.pathname
    const initialSearch = window.location.search

    const init = () => {
      if (!isFirstPageViewSent.current) {
        sendPageView(initialPathname, initialSearch)
        isFirstPageViewSent.current = true
      }
    }

    // @ts-ignore
    if (typeof window.gtag === 'function') {
      init()
    } else {
      const interval = setInterval(() => {
        // @ts-ignore
        if (typeof window.gtag === 'function') {
          init()
          clearInterval(interval)
        }
      }, 100)
    }

    const handleRouteChange = (url: string) => {
      const [pathname, search] = url.split('?')
      if (pathname === initialPathname && !search) {
        return
      }

      sendPageView(pathname, search || '')
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${CHAIN_CONFIG.GOOGLE_ANALYTICS_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
    `}
      </Script>

      <ErrorBoundary>
        <Head>
          <title>
            {CHAIN_CONFIG.DEX_NAME} | {CHAIN_CONFIG.TITLE}
          </title>
          <link rel="apple-touch-icon" href="/chain-configs/favicon.png" />
          <link rel="icon" type="image/png" href="/chain-configs/favicon.png" />
        </Head>
        <WalletProvider>
          <ChainProvider>
            <TransactionProvider>
              <CurrencyProvider>
                <div className="relative flex flex-col w-[100vw] min-h-[100vh] bg-[#0F1013] text-white bg-right bg-no-repeat">
                  <PanelWrapper open={open} setOpen={setOpen} />
                  <SidebarWrapper />
                  <HeaderContainer onMenuClick={() => setOpen(true)} />

                  {router.pathname.includes('/discover') ? (
                    <TradeProvidersWrapper>
                      <div className="flex flex-1 relative xl:w-full xl:justify-center">
                        <div className="flex w-full flex-col xl:items-center gap-6 md:gap-11 md:ml-24 pb-0 mt-[30px] md:mt-[56px]">
                          <Component {...pageProps} />
                        </div>
                      </div>
                    </TradeProvidersWrapper>
                  ) : router.pathname.includes('/trade') ? (
                    <TradeProvidersWrapper>
                      <div className="flex flex-1 relative justify-center">
                        <div className="flex w-full flex-col items-center gap-7 md:gap-11 px-2 pb-0 mt-[72px] md:mt-[108px]">
                          <Component {...pageProps} />
                        </div>
                      </div>
                    </TradeProvidersWrapper>
                  ) : router.pathname.includes('/earn/[poolKey]') ? (
                    <PoolProvidersWrapper>
                      <div className="flex flex-1 relative justify-center">
                        <div className="flex w-full flex-col items-center gap-7 md:gap-11 px-2 pb-0 mt-[72px] md:mt-[112px]">
                          <Component {...pageProps} />
                        </div>
                      </div>
                    </PoolProvidersWrapper>
                  ) : router.pathname.includes('/earn') ? (
                    <PoolProvidersWrapper>
                      <div className="flex flex-1 relative xl:w-full xl:justify-center">
                        <div className="flex w-full flex-col xl:items-center gap-6 md:gap-11 md:ml-24 pb-0 mt-[30px] sm:mt-10 md:mt-[56px]">
                          <Component {...pageProps} />
                        </div>
                      </div>
                    </PoolProvidersWrapper>
                  ) : router.pathname.includes('/futures') ? (
                    <FuturesProvidersWrapper>
                      <div className="flex flex-1 relative justify-center">
                        <div className="flex w-full flex-col items-center gap-6 md:gap-11 px-2 pb-0">
                          <Component {...pageProps} />
                        </div>
                      </div>
                    </FuturesProvidersWrapper>
                  ) : (
                    <TradeProvidersWrapper>
                      <div className="flex flex-1 relative justify-center">
                        <div className="flex w-full flex-col items-center gap-6 md:gap-11 px-2 pb-0 mt-[30px] md:mt-[56px]">
                          <Component {...pageProps} />
                        </div>
                      </div>
                    </TradeProvidersWrapper>
                  )}

                  <FooterWrapper />
                </div>
              </CurrencyProvider>
            </TransactionProvider>
          </ChainProvider>
        </WalletProvider>
      </ErrorBoundary>
    </>
  )
}

export default dynamic(() => Promise.resolve(App), {
  ssr: false,
})
