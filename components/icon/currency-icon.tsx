import React from 'react'
import { isAddressEqual } from 'viem'
import Image from 'next/image'

import { Currency } from '../../model/currency'
import { Chain } from '../../model/chain'
import { CHAIN_CONFIG } from '../../chain-configs'

import { LpCurrencyIcon } from './lp-currency-icon'

type CurrencyIconProps = {
  chain: Chain
  currency: Currency
  unoptimized?: boolean
} & React.HTMLAttributes<HTMLDivElement>

function getLogo(chain: Chain, currency?: Currency): string {
  if (!currency) {
    return '/unknown.svg'
  }
  if (currency.icon) {
    return currency.icon
  }
  if (chain.testnet) {
    return '/unknown.svg'
  }
  // return `https://assets.odos.xyz/tokens/${encodeURIComponent(currency.symbol)}.webp`
  return '/unknown.svg'
}

function isLpCurrency(currency: Currency): currency is Currency & {
  currencyA: Currency
  currencyB: Currency
} {
  return Boolean((currency as any).currencyA && (currency as any).currencyB)
}

const CurrencyIconBase = ({
  chain,
  currency,
  unoptimized,
  ...props
}: CurrencyIconProps) => {
  if (isLpCurrency(currency)) {
    return (
      <LpCurrencyIcon
        chain={chain}
        currencyA={currency.currencyA}
        currencyB={currency.currencyB}
        unoptimized={unoptimized}
        {...props}
      />
    )
  }

  const whitelisted = CHAIN_CONFIG.WHITELISTED_CURRENCIES.find((c) =>
    isAddressEqual(c.address, currency.address),
  )
  const src = whitelisted?.icon ?? getLogo(chain, currency)

  return (
    <div {...props}>
      <Image
        unoptimized={unoptimized}
        priority={unoptimized}
        className="flex rounded-full"
        alt={`${chain.id}-${currency.address}`}
        src={src}
        width={32}
        height={32}
      />
    </div>
  )
}

export const CurrencyIcon = React.memo(CurrencyIconBase, (prev, next) => {
  const sameChain = prev.chain.id === next.chain.id
  const sameClass = prev.className === next.className
  const sameStyle = JSON.stringify(prev.style) === JSON.stringify(next.style)

  const isPrevLp = isLpCurrency(prev.currency)
  const isNextLp = isLpCurrency(next.currency)

  if (isPrevLp && isNextLp) {
    return (
      sameChain &&
      isAddressEqual(
        prev.currency.currencyA.address,
        next.currency.currencyA.address,
      ) &&
      isAddressEqual(
        prev.currency.currencyB.address,
        next.currency.currencyB.address,
      ) &&
      sameClass &&
      sameStyle
    )
  }

  if (!isPrevLp && !isNextLp) {
    return (
      sameChain &&
      isAddressEqual(prev.currency.address, next.currency.address) &&
      sameClass &&
      sameStyle
    )
  }

  return false
})
