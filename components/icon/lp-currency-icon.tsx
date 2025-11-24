import React, { useEffect, useState } from 'react'
import { isAddressEqual } from 'viem'
import Image from 'next/image'

import { Currency } from '../../model/currency'
import { Chain } from '../../model/chain'
import { CHAIN_CONFIG } from '../../chain-configs'

type CurrencyIconProps = {
  chain: Chain
  currencyA: Currency
  currencyB: Currency
  unoptimized?: boolean
} & React.HTMLAttributes<HTMLDivElement>

function getLogo(chain: Chain, currency?: Currency): string {
  if (!currency || chain.testnet) {
    return '/unknown.svg'
  }
  if (currency.icon) {
    return currency.icon
  }
  // return `https://assets.odos.xyz/tokens/${encodeURIComponent(
  //   currency.symbol,
  // )}.webp`
  return '/unknown.svg'
}

const CurrencyIconBase = ({
  chain,
  currencyA,
  currencyB,
  unoptimized,
  ...props
}: CurrencyIconProps) => {
  const _currencyA = CHAIN_CONFIG.WHITELISTED_CURRENCIES.find((c) =>
    isAddressEqual(c.address, currencyA.address),
  )
  const _currencyB = CHAIN_CONFIG.WHITELISTED_CURRENCIES.find((c) =>
    isAddressEqual(c.address, currencyB.address),
  )

  const defaultCurrencyASrc = _currencyA?.icon ?? getLogo(chain, currencyA)
  const defaultCurrencyBSrc = _currencyB?.icon ?? getLogo(chain, currencyB)
  const [srcA, setSrcA] = useState(defaultCurrencyASrc)
  const [srcB, setSrcB] = useState(defaultCurrencyBSrc)

  useEffect(() => {
    setSrcA(defaultCurrencyASrc)
    setSrcB(defaultCurrencyBSrc)
  }, [defaultCurrencyASrc, defaultCurrencyBSrc])

  return (
    <div {...props}>
      <div className="relative w-full h-full rounded-full overflow-hidden border border-white bg-[#13161b]">
        <div className="absolute top-0 left-0 w-full h-full">
          <Image
            fill
            src={srcA}
            unoptimized={unoptimized}
            priority={unoptimized}
            alt="token-a"
            className="object-cover [clip-path:polygon(0%_0%,50%_0%,50%_100%,0%_100%)]"
          />
        </div>

        <div className="absolute top-0 left-0 w-full h-full">
          <Image
            fill
            src={srcB}
            unoptimized={unoptimized}
            priority={unoptimized}
            alt="token-b"
            className="object-cover [clip-path:polygon(50%_0%,100%_0%,100%_100%,50%_100%)]"
          />
        </div>
      </div>
    </div>
  )
}

export const LpCurrencyIcon = React.memo(
  CurrencyIconBase,
  (prev, next) =>
    prev.chain.id === next.chain.id &&
    isAddressEqual(prev.currencyA.address, next.currencyA.address) &&
    isAddressEqual(prev.currencyB.address, next.currencyB.address) &&
    prev.className === next.className &&
    JSON.stringify(prev.style) === JSON.stringify(next.style),
)
