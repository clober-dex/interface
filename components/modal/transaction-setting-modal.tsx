import React, { useCallback, useEffect } from 'react'
import BigNumber from 'bignumber.js'
import { Tooltip } from 'react-tooltip'

import Modal from '../../components/modal/modal'
import NumberInput from '../input/number-input'
import { applyPercent, formatUnits } from '../../utils/bigint'
import { formatTinyNumber } from '../../utils/bignumber'
import { QuestionMarkSvg } from '../svg/question-mark-svg'
import useDropdown from '../../hooks/useDropdown'
import { executors } from '../../chain-configs/executors'
import { DownBracketAngleSvg } from '../svg/down-bracket-angle-svg'

const NORMAL_MULTIPLIER = 1.05
const FAST_MULTIPLIER = 1.3
const INSTANT_MULTIPLIER = 1.5

export const TransactionSettingModal = ({
  selectedExecutorName,
  setSelectedExecutorName,
  gasPriceMultiplier,
  setGasPriceMultiplier,
  currentGasPrice,
  onClose,
}: {
  selectedExecutorName: string | null
  setSelectedExecutorName: (executorName: string | null) => void
  gasPriceMultiplier: string
  setGasPriceMultiplier: (value: string) => void
  currentGasPrice: bigint
  onClose: () => void
}) => {
  const { showDropdown, setShowDropdown } = useDropdown()

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
  const [customGasPrice, setCustomGasPrice] = React.useState<string>(
    Number(gasPriceMultiplier) !== NORMAL_MULTIPLIER &&
      Number(gasPriceMultiplier) !== FAST_MULTIPLIER &&
      Number(gasPriceMultiplier) !== INSTANT_MULTIPLIER
      ? new BigNumber(calculateGasPrice(Number(gasPriceMultiplier))).toFixed(1)
      : '',
  )

  useEffect(() => {
    setSelectedExecutorName(null)
  }, [setSelectedExecutorName])

  return (
    <Modal show onClose={onClose} onButtonClick={onClose}>
      <h1 className="flex font-bold text-xl mb-2 justify-center items-center">
        Settings
      </h1>
      <div className="flex flex-col gap-4 sm:gap-7 mt-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-row gap-1 self-stretch justify-start text-[#7b8394] text-sm font-semibold">
            MEV Protection (Swap only)
            <div className="flex mr-auto mt-[5.3px]">
              <QuestionMarkSvg
                data-tooltip-id="mev-protection"
                data-tooltip-place="bottom-end"
                data-tooltip-html={
                  'Monad generally uses a private mempool, so only validators can perform MEV attacks. The MEV Protector only works for Meta Aggregator swaps, and enabling it may cause transactions to fail more often or become slower.'
                }
                className="w-3 h-3"
              />
              <Tooltip
                id="mev-protection"
                className="max-w-[400px] bg-gray-950 !opacity-100 z-[100]"
                clickable
              />
            </div>
          </div>

          <div className=" h-9 sm:h-10 w-full items-center justify-center flex bg-gray-700 rounded-[22px] p-1 flex-row relative text-gray-400 text-base font-bold">
            <button
              disabled={!useMevProtection}
              onClick={() => {
                setUseMevProtection(false)
                setSelectedExecutorName(null)
              }}
              className="text-xs sm:text-sm flex flex-1 px-6 py-2 rounded-[18px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
            >
              Disable
            </button>
            <button
              disabled={useMevProtection}
              // onClick={() => {
              //   setUseMevProtection(true)
              //   if (selectedExecutorName === null) {
              //     setSelectedExecutorName(
              //       executors[0].name, // Default to the first executor
              //     )
              //   }
              // }}
              className="text-xs sm:text-sm flex flex-1 px-6 py-2 rounded-[18px] text-gray-400 disabled:text-white disabled:bg-blue-500 justify-center items-center gap-1"
            >
              Enable
            </button>
          </div>
        </div>

        {useMevProtection && (
          <div className="self-stretch inline-flex flex-col justify-start items-start gap-3">
            <div className="self-stretch h-[17px] justify-start text-[#7b8394] text-sm font-semibold">
              Preferred MEV Executor
            </div>
            <div className="relative self-stretch h-10 sm:h-12 px-4 py-1 bg-gray-800 rounded-xl flex flex-col justify-center items-center gap-2.5">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="self-stretch inline-flex justify-start items-center gap-2.5"
              >
                <div className="flex-1 flex justify-start items-center gap-2">
                  <div className="justify-start text-white text-sm sm:text-base font-semibold">
                    {executors.find(
                      (executor) => executor.name === selectedExecutorName,
                    )?.name || 'Select Executor'}
                  </div>
                </div>

                <DownBracketAngleSvg className="sm:w-5 w-4 sm:h-5 h-4" />
              </button>

              {showDropdown && (
                <div className="absolute w-full z-[1000] top-11 sm:top-14 bg-gray-800 rounded-xl shadow-lg gap-1 flex flex-col">
                  {executors.map(({ name }, index) => (
                    <button
                      key={name}
                      onClick={() => {
                        const executorName = executors.find(
                          (executor) => executor.name === name,
                        )
                        if (executorName) {
                          setSelectedExecutorName(executorName.name)
                        }

                        setShowDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-1 h-10 sm:h-12 text-white hover:bg-gray-700 text-sm sm:text-base ${
                        selectedExecutorName === name ? 'font-bold' : ''
                      } ${
                        index === executors.length - 1 ? 'rounded-b-xl' : ''
                      } ${index === 0 ? 'rounded-t-xl' : ''}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
          <div className="w-full sm:w-fit flex ml-auto">
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
                  className={`w-[78px] flex flex-col gap-1 flex-1 px-6 py-1 rounded-[20px] text-center items-center ${customGasPrice.length > 0 && (Number(customGasPrice) / Number(formatUnits(BigInt(currentGasPrice), 9)) >= 2 || Number(customGasPrice) / Number(formatUnits(BigInt(currentGasPrice), 9)) < 1) ? 'text-yellow-500' : 'text-white'} ${customGasPrice.length !== 0 ? 'outline outline-1 outline-blue-500 rounded-full' : ''}`}
                >
                  <span>Custom</span>
                  <NumberInput
                    placeholder={new BigNumber(
                      formatTinyNumber(calculateGasPrice(NORMAL_MULTIPLIER)),
                    ).toFixed(1)}
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

        {/*<div className="flex flex-col sm:flex-row w-full gap-3">*/}
        {/*  <div className="self-stretch justify-start text-[#7b8394] text-sm font-semibold">*/}
        {/*    Max Slippage*/}
        {/*  </div>*/}
        {/*  <div className="flex ml-auto">*/}
        {/*    <SlippageToggle*/}
        {/*      slippageInput={slippageInput}*/}
        {/*      setSlippageInput={setSlippageInput}*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>
    </Modal>
  )
}
