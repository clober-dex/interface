import React from 'react'

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
  rpcList,
  onClose,
}: {
  selectedExplorer: string
  setSelectedExplorer: (explorer: string) => void
  explorerList: NamedUrl[]
  selectedRpcEndpoint: string
  setSelectedRpcEndpoint: (rpcEndpoint: string) => void
  rpcList: (NamedUrl & {
    connectionDurationInMs: number
  })[]
  onClose: () => void
}) => {
  const { showDropdown, setShowDropdown } = useDropdown()

  return (
    <Modal show onClose={() => {}} onButtonClick={onClose}>
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
            {rpcList
              .sort(
                (a, b) => a.connectionDurationInMs - b.connectionDurationInMs,
              )
              .map(({ url, name, connectionDurationInMs }) => (
                <RpcEndPointRow
                  key={url}
                  name={name}
                  connectionDurationInMs={connectionDurationInMs}
                  selected={selectedRpcEndpoint === url}
                  setSelectedRpcEndpoint={() => {
                    setSelectedRpcEndpoint(url)
                  }}
                />
              ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
