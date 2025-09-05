import React from 'react'

import { Quote } from '../../model/aggregator/quote'
import { Currency } from '../../model/currency'
import { LimitForm, LimitFormProps } from '../form/limit-form'
import { ActionButton, ActionButtonProps } from '../button/action-button'
import CloseSvg from '../svg/close-svg'
import { SwapRouteList } from '../swap-router-list'
import { aggregators } from '../../chain-configs/aggregators'

export const MobileFixedModal = ({
  tab,
  disabled,
  quotes,
  inputCurrency,
  outputCurrency,
  showMobileModal,
  setShowMobileModal,
  selectedQuote,
  setSelectedQuote,
  limitFormProps,
  swapActionButtonProps,
}: {
  tab: 'limit' | 'swap'
  disabled: boolean
  quotes: { best: Quote | null; all: Quote[] }
  inputCurrency: Currency | undefined
  outputCurrency: Currency | undefined
  showMobileModal: boolean
  setShowMobileModal: (show: boolean) => void
  selectedQuote: Quote | null
  setSelectedQuote: (quote: Quote | null) => void
  limitFormProps: LimitFormProps
  swapActionButtonProps: ActionButtonProps
}) => {
  return (
    <div className="fixed flex w-full overflow-y-scroll md:hidden bottom-0 z-[1000]">
      <div
        className={`${
          showMobileModal ? 'flex' : 'hidden'
        } w-full h-full fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm`}
        onClick={() => setShowMobileModal(false)}
      />
      <div className="w-full h-full top-0 absolute bg-[#171b24] shadow rounded-tl-2xl rounded-tr-2xl border" />
      <div
        className={`z-[10000] w-full flex flex-col ${
          showMobileModal ? '' : 'px-5 sm:px-5 pt-3'
        }`}
      >
        <div
          className={`${
            showMobileModal ? 'flex max-h-[560px] mt-5' : 'hidden'
          } flex-col mb-5`}
        >
          {tab === 'limit' ? (
            <LimitForm {...limitFormProps} />
          ) : (
            <div className="flex md:hidden flex-col gap-4 px-5">
              <div className="flex flex-row gap-1 justify-start text-white text-[13px] font-semibold">
                Swap {inputCurrency?.symbol ?? ''}{' '}
                <span className="text-[#8690a5]">&#8594; </span>
                {outputCurrency?.symbol ?? ''}
                <button
                  className="flex md:hidden w-5 h-5 ml-auto"
                  onClick={() => setShowMobileModal(false)}
                >
                  <CloseSvg />
                </button>
              </div>

              <div className="flex flex-col w-full mb-4 max-h-[400px] sm:mb-4 overflow-y-auto">
                <SwapRouteList
                  quotes={quotes.all}
                  bestQuote={quotes.best}
                  outputCurrency={outputCurrency}
                  aggregatorNames={aggregators.map((a) => a.name)}
                  selectedQuote={selectedQuote}
                  setSelectedQuote={setSelectedQuote}
                />
              </div>

              <ActionButton {...swapActionButtonProps} />
            </div>
          )}
        </div>

        <button
          onClick={() => setShowMobileModal(true)}
          disabled={disabled}
          className={`disabled:bg-[#2b3544] disabled:text-gray-400 text-white w-full ${
            showMobileModal ? 'hidden' : 'flex'
          } h-12 sm:h-14 bg-blue-500 rounded-xl justify-center items-center mb-5`}
        >
          <div className="grow shrink basis-0 opacity-90 text-center text-base font-bold">
            {tab === 'limit' ? 'Make order' : 'Quotes'}
          </div>
        </button>
      </div>
    </div>
  )
}
