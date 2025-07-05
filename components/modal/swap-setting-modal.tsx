import React, { useCallback } from 'react'
import BigNumber from 'bignumber.js'
import { Tooltip } from 'react-tooltip'

import Modal from '../../components/modal/modal'
import { SlippageToggle } from '../toggle/slippage-toggle'
import NumberInput from '../input/number-input'
import { applyPercent, formatUnits } from '../../utils/bigint'
import { formatTinyNumber } from '../../utils/bignumber'
import { QuestionMarkSvg } from '../svg/question-mark-svg'

const NORMAL_MULTIPLIER = 1.05
const FAST_MULTIPLIER = 1.3
const INSTANT_MULTIPLIER = 1.5

export const SwapSettingModal = ({
  selectedExecutorName,
  gasPriceMultiplier,
  setGasPriceMultiplier,
  slippageInput,
  setSlippageInput,
  currentGasPrice,
  onClose,
}: {
  selectedExecutorName: string | null
  gasPriceMultiplier: string
  setGasPriceMultiplier: (value: string) => void
  slippageInput: string
  setSlippageInput: (value: string) => void
  currentGasPrice: bigint
  onClose: () => void
}) => {
  const [customGasPrice, setCustomGasPrice] = React.useState<string>('')
  const [useMevProtection, setUseMevProtection] = React.useState(
    selectedExecutorName !== null,
  )
  const calculateGasPrice = useCallback(
    (gasPriceMultiplier: number) =>
      Number(
        formatUnits(applyPercent(currentGasPrice, 100 * gasPriceMultiplier), 9),
      ),
    [currentGasPrice],
  )

  return (
    <Modal show onClose={onClose} onButtonClick={onClose}>
      <h1 className="flex font-bold text-xl mb-2 justify-center items-center">
        Swap Setting
      </h1>
      <div className="flex flex-col gap-4 sm:gap-7 mt-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="self-stretch justify-start text-[#7b8394] text-sm font-semibold">
            MEV Protection
          </div>

          <div className=" h-9 sm:h-10 w-full items-center justify-center flex bg-gray-700 rounded-[22px] p-1 flex-row relative text-gray-400 text-base font-bold">
            <button
              disabled={!useMevProtection}
              onClick={() => setUseMevProtection(false)}
              className="text-xs sm:text-sm flex flex-1 px-6 py-2 rounded-[18px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
            >
              Disable
            </button>
            <div
              // disabled={useMevProtection}
              // onClick={() => setUseMevProtection(true)}
              className="text-xs sm:text-sm flex flex-1 px-6 py-2 rounded-[18px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
            >
              Enable
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full gap-3">
          <div className="flex flex-row gap-1 self-stretch justify-start text-[#7b8394] text-sm font-semibold text-nowrap">
            Gas Price (Gwei)
            <div className="flex mr-auto mt-[5.3px]">
              <QuestionMarkSvg
                data-tooltip-id="custom-gas-price"
                data-tooltip-place="bottom-end"
                data-tooltip-html={
                  'Only supported on limited wallets (e.g. MetaMask).'
                }
                className="w-3 h-3"
              />
              <Tooltip
                id="custom-gas-price"
                className="max-w-[400px] bg-gray-950 !opacity-100 z-[100]"
                clickable
              />
            </div>
          </div>
          <div className="flex ml-auto">
            <div className="flex h-full w-full flex-col gap-2 text-xs sm:text-sm text-white">
              <div className="h-12 bg-gray-600 text-white rounded-[22px] py-0.5 w-full flex flex-row relative text-xs">
                <button
                  disabled={Number(gasPriceMultiplier) === NORMAL_MULTIPLIER}
                  onClick={() => {
                    setGasPriceMultiplier(NORMAL_MULTIPLIER.toString())
                    setCustomGasPrice('')
                  }}
                  className="w-[69px] flex flex-col flex-1 px-6 py-0 rounded-[20px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1"
                >
                  Normal
                  <span className="text-nowrap font-bold">
                    {new BigNumber(
                      formatTinyNumber(calculateGasPrice(NORMAL_MULTIPLIER)),
                    ).toFixed(1)}
                  </span>
                </button>

                <button
                  disabled={Number(gasPriceMultiplier) === FAST_MULTIPLIER}
                  onClick={() => {
                    setGasPriceMultiplier(FAST_MULTIPLIER.toString())
                    setCustomGasPrice('')
                  }}
                  className="w-[69px] flex flex-col flex-1 px-6 py-0 rounded-[20px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1"
                >
                  Fast
                  <span className="text-nowrap font-bold">
                    {new BigNumber(
                      formatTinyNumber(calculateGasPrice(FAST_MULTIPLIER)),
                    ).toFixed(1)}
                  </span>
                </button>

                <button
                  disabled={Number(gasPriceMultiplier) === INSTANT_MULTIPLIER}
                  onClick={() => {
                    setGasPriceMultiplier(INSTANT_MULTIPLIER.toString())
                    setCustomGasPrice('')
                  }}
                  className="w-[69px] flex flex-col flex-1 px-6 py-0 rounded-[20px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1"
                >
                  Instant
                  <span className="text-nowrap font-bold">
                    {new BigNumber(
                      formatTinyNumber(calculateGasPrice(INSTANT_MULTIPLIER)),
                    ).toFixed(1)}
                  </span>
                </button>

                <div
                  className={`w-[72px] flex flex-col flex-1 px-6 py-1 rounded-[20px] text-center items-center ${customGasPrice.length > 0 && (Number(customGasPrice) / Number(formatUnits(BigInt(currentGasPrice), 9)) >= 2 || Number(customGasPrice) / Number(formatUnits(BigInt(currentGasPrice), 9)) < 1) ? 'text-yellow-500' : 'text-white'} ${customGasPrice.length !== 0 ? 'outline outline-1 outline-blue-500 rounded-full' : ''}`}
                >
                  <span>Custom</span>
                  <NumberInput
                    placeholder=""
                    disabled={
                      Number(gasPriceMultiplier) === NORMAL_MULTIPLIER &&
                      Number(gasPriceMultiplier) === FAST_MULTIPLIER &&
                      Number(gasPriceMultiplier) === INSTANT_MULTIPLIER
                    }
                    value={customGasPrice}
                    onValueChange={(e) => {
                      const decimals = e.split('.')[1]
                      if (decimals && decimals.length > 2) {
                        return
                      }
                      if (Number(e) <= 0) {
                        setGasPriceMultiplier(NORMAL_MULTIPLIER.toString())
                        setCustomGasPrice('')
                        return
                      }
                      const v =
                        Number(e) /
                        Number(formatUnits(BigInt(currentGasPrice), 9))
                      setGasPriceMultiplier(v.toString())
                      setCustomGasPrice(e)
                    }}
                    className={`bg-gray-600 text-center w-[60px] flex flex-1 rounded-[18px] disabled:text-blue-400 disabled:bg-blue-500/25 justify-center items-center gap-1`}
                  />
                </div>
              </div>
              {/**/}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full gap-3">
          <div className="self-stretch justify-start text-[#7b8394] text-sm font-semibold">
            Max Slippage
          </div>
          <div className="flex ml-auto">
            <SlippageToggle
              slippageInput={slippageInput}
              setSlippageInput={setSlippageInput}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
