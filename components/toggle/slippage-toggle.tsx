import React, { useEffect, useRef } from 'react'

import NumberInput from '../input/number-input'

const UNLIMITED_SLIPPAGE = 50
const FIRST_SLIPPAGE = 0.5
const SECOND_SLIPPAGE = 1.0

export const SlippageToggle = ({
  slippageInput,
  setSlippageInput,
}: {
  slippageInput: string
  setSlippageInput: (slippageInput: string) => void
}) => {
  const [customValue, setCustomValue] = React.useState<string>('')
  const prevCustomValueRef = useRef<string>('')

  useEffect(() => {
    if (
      Number(slippageInput) !== FIRST_SLIPPAGE &&
      Number(slippageInput) !== SECOND_SLIPPAGE &&
      Number(slippageInput) !== UNLIMITED_SLIPPAGE
    ) {
      setCustomValue(slippageInput)
    }
  }, [slippageInput])

  useEffect(() => {
    if (prevCustomValueRef.current !== '' && customValue === '') {
      setSlippageInput(SECOND_SLIPPAGE.toString())
    }
    prevCustomValueRef.current = customValue
  }, [customValue, setSlippageInput])

  return (
    <div className="flex h-full w-full flex-col gap-2 text-xs sm:text-sm text-white">
      <div className="bg-gray-600 text-white rounded-[22px] h-7 py-0.5 w-full flex flex-row relative text-xs">
        <button
          disabled={Number(slippageInput) === FIRST_SLIPPAGE}
          onClick={() => {
            setSlippageInput(FIRST_SLIPPAGE.toString())
            setCustomValue('')
          }}
          className="flex flex-1 pr-2 pl-4 py-0 rounded-[18px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1"
        >
          {FIRST_SLIPPAGE.toFixed(2)}%
        </button>
        <button
          disabled={Number(slippageInput) === SECOND_SLIPPAGE}
          onClick={() => {
            setSlippageInput(SECOND_SLIPPAGE.toString())
            setCustomValue('')
          }}
          className="flex flex-1 px-2 py-0 rounded-[18px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1"
        >
          {SECOND_SLIPPAGE.toFixed(2)}%
        </button>
        <button
          disabled={Number(slippageInput) === UNLIMITED_SLIPPAGE}
          onClick={() => {
            setSlippageInput(UNLIMITED_SLIPPAGE.toString())
            setCustomValue('')
          }}
          className="flex flex-1 px-2 py-0 rounded-[18px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1"
        >
          Unlimited
        </button>
        <div
          className={`flex flex-row items-center pr-2 ${customValue.length > 0 && (Number(slippageInput) >= 2 || Number(slippageInput) <= 0.05) ? 'text-yellow-500' : 'text-white'} ${customValue.length !== 0 ? 'outline outline-1 outline-blue-500 rounded-full' : ''}`}
        >
          <NumberInput
            placeholder="Custom"
            disabled={
              Number(slippageInput) === FIRST_SLIPPAGE &&
              Number(slippageInput) === SECOND_SLIPPAGE &&
              Number(slippageInput) === UNLIMITED_SLIPPAGE
            }
            value={customValue}
            onValueChange={(e) => {
              const decimals = e.split('.')[1]
              if (decimals && decimals.length > 2) {
                return
              }
              if (Number(e) < 0 || Number(e) > 50) {
                return
              }
              setSlippageInput(e)
              setCustomValue(e)
            }}
            className={`bg-gray-600 text-center w-[60px] flex flex-1 pl-2 py-0 rounded-[18px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1`}
          />
          %
        </div>
      </div>

      {Number(slippageInput) >= 2 ? (
        <div className="flex w-full">
          <div className="flex flex-row items-center gap-1 ml-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              className="fill-yellow-500 stroke-amber-500 w-4 h-4"
            >
              <path d="M7.9999 4.16036L12.7918 12.4396H3.20798L7.9999 4.16036ZM8.86533 3.11604C8.48016 2.45076 7.51964 2.45076 7.13448 3.11604L1.86878 12.2113C1.48281 12.878 1.96387 13.7124 2.7342 13.7124H13.2656C14.0359 13.7124 14.517 12.878 14.131 12.2113L8.86533 3.11604Z" />
              <path d="M8.63628 11.1669C8.63628 10.8154 8.35136 10.5305 7.9999 10.5305C7.64844 10.5305 7.36353 10.8154 7.36353 11.1669C7.36353 11.5184 7.64844 11.8033 7.9999 11.8033C8.35136 11.8033 8.63628 11.5184 8.63628 11.1669Z" />
              <path d="M8.63628 7.34878C8.63628 6.99732 8.35136 6.7124 7.9999 6.7124C7.64844 6.7124 7.36353 6.99732 7.36353 7.34878V9.25791C7.36353 9.60937 7.64844 9.89429 7.9999 9.89429C8.35136 9.89429 8.63628 9.60937 8.63628 9.25791V7.34878Z" />
            </svg>
            {Number(slippageInput) >= UNLIMITED_SLIPPAGE
              ? 'Unlimited'
              : `${Number(slippageInput)}%`}{' '}
            Slippage
          </div>
        </div>
      ) : (
        <></>
      )}

      {Number(slippageInput) < FIRST_SLIPPAGE ? (
        <div className="flex w-full text-nowrap justify-end text-yellow-500">
          Slippage below {FIRST_SLIPPAGE}% may result in a failed tx.
        </div>
      ) : (
        <></>
      )}

      {Number(slippageInput) < 2 && Number(slippageInput) >= FIRST_SLIPPAGE && (
        <div className="hidden sm:flex h-4 sm:h-5 w-1" />
      )}
    </div>
  )
}
