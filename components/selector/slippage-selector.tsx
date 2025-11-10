import React, { useEffect, useRef } from 'react'

import NumberInput from '../input/number-input'

const UNLIMITED_SLIPPAGE = 50
const FIRST_SLIPPAGE = 1.99
const SECOND_SLIPPAGE = 3.99
const WARNING_SLIPPAGE_THRESHOLD = 10.0

export const SlippageSelector = ({
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
    } else {
      setCustomValue('')
    }
  }, [slippageInput])

  useEffect(() => {
    if (prevCustomValueRef.current !== '' && customValue === '') {
      setSlippageInput(SECOND_SLIPPAGE.toString())
    }
    prevCustomValueRef.current = customValue
  }, [customValue, setSlippageInput])

  return (
    <div className="flex h-full w-full flex-col gap-1.5 text-white">
      <div className="bg-gray-600 text-white rounded-[22px] ml-auto w-fit h-7 py-0.5 flex flex-row relative text-xs mt-2.5">
        <button
          disabled={Number(slippageInput) === FIRST_SLIPPAGE}
          onClick={() => {
            setSlippageInput(FIRST_SLIPPAGE.toString())
            setCustomValue('')
          }}
          className="flex flex-1 pr-2 pl-3 py-0 rounded-[18px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1"
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
          className="w-[34px] sm:w-[46px] flex flex-1 px-2 py-0 rounded-[18px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1"
        >
          ∞
        </button>

        <div
          className={`flex flex-row items-center pr-2 ${customValue.length > 0 && (Number(slippageInput) >= WARNING_SLIPPAGE_THRESHOLD || Number(slippageInput) <= 0.05) ? 'text-yellow-500' : 'text-white'} ${customValue.length !== 0 ? 'outline outline-1 outline-blue-500 rounded-full' : ''}`}
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

      {Number(slippageInput) >= WARNING_SLIPPAGE_THRESHOLD ? (
        <div className="flex w-full">
          <div className="flex flex-row items-center gap-1 ml-auto text-[13px] font-medium text-yellow-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="w-4 h-4"
            >
              <path
                d="M8.9073 4.41123C9.38356 3.55396 10.6164 3.55396 11.0927 4.41122L16.6937 14.493C17.1565 15.3261 16.5541 16.35 15.601 16.35H4.39903C3.44592 16.35 2.84346 15.3261 3.30633 14.493L8.9073 4.41123Z"
                stroke="#FACC15"
                strokeWidth="1.5"
              ></path>
              <path
                d="M10 9V10.8"
                stroke="#FACC15"
                strokeWidth="1.5"
                strokeLinecap="round"
              ></path>
              <circle cx="9.99961" cy="13.5" r="0.9" fill="#FACC15"></circle>
            </svg>
            Warning: High slippage ({slippageInput}%)
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

      {Number(slippageInput) < WARNING_SLIPPAGE_THRESHOLD &&
        Number(slippageInput) >= FIRST_SLIPPAGE && (
          <div className="flex h-[19.5px] w-1" />
        )}
    </div>
  )
}
