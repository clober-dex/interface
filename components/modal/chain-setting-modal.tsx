import React, { useEffect } from 'react'

import Modal from '../../components/modal/modal'
import { DownBracketAngleSvg } from '../svg/down-bracket-angle-svg'
import useDropdown from '../../hooks/useDropdown'
import { NamedUrl } from '../../model/named-url'

const RpcEndPointRow = ({
  name,
  connectionDurationInMs,
  selected,
  setSelectedRpcEndpoint,
}: {
  name: string
  connectionDurationInMs: number
  selected: boolean
  setSelectedRpcEndpoint: () => void
}) => {
  return (
    <div className="flex flex-col justify-start items-start gap-2.5 w-full">
      <div className="w-full flex justify-start items-center gap-2 sm:gap-4">
        <button
          onClick={() => setSelectedRpcEndpoint()}
          className="flex justify-center items-center w-4 sm:w-8 h-4 sm:h-8"
        >
          {selected ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
            >
              <circle
                cx="14"
                cy="14"
                r="13.25"
                stroke="#3B82F6"
                strokeWidth="1.5"
              />
              <circle cx="14" cy="14" r="9" fill="#3B82F6" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
            >
              <circle
                cx="14"
                cy="14"
                r="13.25"
                stroke="#374151"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </button>

        <div className="flex-1 flex justify-start items-center gap-4 text-white text-sm sm:text-base font-semibold">
          {name}
        </div>

        {connectionDurationInMs > 0 && (
          <div className="flex justify-start items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
            >
              <circle
                cx="5"
                cy="5"
                r="5"
                fill={
                  connectionDurationInMs < 100
                    ? '#10B981'
                    : connectionDurationInMs < 500
                      ? '#F59E0B'
                      : '#EF4444'
                }
              />
            </svg>

            <div className="justify-start text-gray-400 text-[13px] font-semibold">
              {connectionDurationInMs.toFixed(0)} ms
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const ChainSettingModal = ({
  selectedExplorer,
  setSelectedExplorer,
  explorerList,
  selectedRpcEndpoint,
  setSelectedRpcEndpoint,
  customRpcEndpoint,
  setCustomRpcEndpoint,
  rpcList,
  onClose,
}: {
  selectedExplorer: string
  setSelectedExplorer: (explorer: string) => void
  explorerList: NamedUrl[]
  selectedRpcEndpoint: string
  setSelectedRpcEndpoint: (rpcEndpoint: string) => void
  customRpcEndpoint: string
  setCustomRpcEndpoint: (rpcEndpoint: string) => void
  rpcList: (NamedUrl & {
    connectionDurationInMs: number
  })[]
  onClose: () => void
}) => {
  const { showDropdown, setShowDropdown } = useDropdown()

  useEffect(() => {
    if (
      customRpcEndpoint.trim() === '' &&
      !rpcList.find((rpc) => rpc.url === selectedRpcEndpoint)
    ) {
      setSelectedRpcEndpoint(rpcList[0]?.url || '')
    }
  }, [customRpcEndpoint, rpcList, selectedRpcEndpoint, setSelectedRpcEndpoint])

  return (
    <Modal
      show
      onClose={() => {
        setShowDropdown(false)
        onClose()
      }}
      onButtonClick={onClose}
    >
      <h1 className="flex font-bold text-xl mb-2 w-full justify-center">
        Setting
      </h1>

      <div className="flex flex-col gap-6">
        <div className="self-stretch inline-flex flex-col justify-start items-start gap-3">
          <div className="self-stretch h-[17px] justify-start text-[#7b8394] text-sm font-semibold mt-4 sm:mt-7">
            Preferred Explorer
          </div>
          <div className="relative self-stretch h-14 px-4 py-3.5 bg-gray-800 rounded-xl flex flex-col justify-center items-center gap-2.5">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="self-stretch inline-flex justify-start items-center gap-2.5"
            >
              <div className="flex-1 flex justify-start items-center gap-2">
                <div className="justify-start text-white text-sm sm:text-base font-semibold">
                  {explorerList.find(
                    (explorer) => explorer.url === selectedExplorer,
                  )?.name || 'Select Explorer'}
                </div>
              </div>

              <DownBracketAngleSvg className="w-5 h-5" />
            </button>

            {showDropdown && (
              <div className="absolute w-full top-16 bg-gray-800 rounded-xl shadow-lg gap-1 flex flex-col">
                {explorerList.map(({ url, name }, index) => (
                  <button
                    key={url}
                    onClick={() => {
                      const selected = explorerList.find(
                        (explorer) => explorer.url === url,
                      )
                      if (selected) {
                        setSelectedExplorer(selected.url)
                      }
                      setShowDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-white hover:bg-gray-700 text-sm sm:text-base ${
                      url === selectedExplorer ? 'font-bold' : ''
                    } ${
                      index === explorerList.length - 1 ? 'rounded-b-xl' : ''
                    } ${index === 0 ? 'rounded-t-xl' : ''}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="self-stretch inline-flex flex-col justify-start items-start gap-5">
          <div className="self-stretch h-[17px] justify-start text-[#7b8394] text-sm font-semibold">
            RPC Endpoint
          </div>

          <div className="flex flex-col justify-start items-start gap-2.5 w-full">
            {[
              ...rpcList,
              {
                name: 'Custom',
                url: customRpcEndpoint,
                connectionDurationInMs: 0,
              },
            ]
              .sort((a, b) => {
                if (a.url === customRpcEndpoint) {
                  return 1
                }
                if (b.url === customRpcEndpoint) {
                  return -1
                }
                return a.connectionDurationInMs - b.connectionDurationInMs
              })
              .map(({ url, name, connectionDurationInMs }) => (
                <RpcEndPointRow
                  key={url}
                  name={name}
                  connectionDurationInMs={connectionDurationInMs}
                  selected={selectedRpcEndpoint === url}
                  setSelectedRpcEndpoint={() => {
                    if (url.startsWith('http')) {
                      setSelectedRpcEndpoint(url)
                    }
                  }}
                />
              ))}
          </div>
        </div>

        <div className="self-stretch flex flex-col gap-2">
          <div className="text-[#7b8394] text-sm font-semibold">Custom</div>
          <div className="self-stretch px-4 py-3 bg-gray-800 rounded-2xl outline outline-1 outline-offset-[-1px] outline-gray-700 flex flex-row gap-2">
            <input
              type="text"
              value={customRpcEndpoint}
              onChange={(e) => setCustomRpcEndpoint(e.target.value)}
              placeholder=""
              className="w-full bg-gray-800 text-white placeholder-gray-500 text-sm sm:text-base focus:outline-none"
            />
            <button
              disabled={
                !customRpcEndpoint || !customRpcEndpoint.startsWith('http')
              }
              className="w-14 h-8 px-3.5 py-1.5 bg-blue-500/25 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (customRpcEndpoint && customRpcEndpoint.startsWith('http')) {
                  setCustomRpcEndpoint(customRpcEndpoint.trim())
                }
              }}
            >
              <div className="text-center text-blue-400 text-sm font-bold">
                Save
              </div>
            </button>
          </div>

          {customRpcEndpoint && !customRpcEndpoint.startsWith('http') && (
            <div className="text-red-500 text-sm font-semibold">
              URL is invalid!
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
