import React from 'react'

import { DiscoverPageSvg } from '../components/svg/discover-page-svg'
import { SwapPageSvg } from '../components/svg/swap-page-svg'
import { EarnPageSvg } from '../components/svg/earn-page-svg'
import { LimitPageSvg } from '../components/svg/limit-page-svg'
import { BridgePageSvg } from '../components/svg/bridge-page-svg'

type PageButton = {
  path: string
  label: string
  icon: React.JSX.Element
  isHiddenMenu: boolean
  externalLink?: string
}

export const PAGE_BUTTONS: PageButton[] = [
  {
    path: '/discover',
    label: 'Discover',
    icon: <DiscoverPageSvg className="w-6 h-6" />,
    isHiddenMenu: false,
  },
  {
    path: '/trade',
    label: 'Trade',
    icon: <SwapPageSvg className="w-6 h-6" />,
    isHiddenMenu: false,
  },
  {
    path: '/earn',
    label: 'Earn',
    icon: <EarnPageSvg className="w-6 h-6" />,
    isHiddenMenu: false,
  },
  {
    path: 'https://perp.clober.io',
    label: 'Perp',
    icon: <LimitPageSvg className="w-6 h-6" />,
    isHiddenMenu: false,
  },
  {
    path: '/bridge',
    label: 'Bridge',
    icon: <BridgePageSvg className="w-6 h-6" />,
    isHiddenMenu: false,
    externalLink: 'https://monadfastbridge.com',
  },
]
