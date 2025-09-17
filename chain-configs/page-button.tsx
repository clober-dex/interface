import React from 'react'

import { DiscoverPageSvg } from '../components/svg/discover-page-svg'
import { SwapPageSvg } from '../components/svg/swap-page-svg'

type PageButton = {
  path: string
  label: string
  icon: React.JSX.Element
  isHiddenMenu: boolean
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
  // {
  //   path: '/earn',
  //   label: 'Earn',
  //   icon: <EarnPageSvg className="w-6 h-6" />,
  //   isHiddenMenu: false,
  // },
]
