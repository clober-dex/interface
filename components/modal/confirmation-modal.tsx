import React from 'react'
import { createPortal } from 'react-dom'

import { Confirmation } from '../../contexts/transaction-context'
import { CurrencyIcon } from '../icon/currency-icon'
import ChainIcon from '../icon/chain-icon'
import { formatWithCommas } from '../../utils/bignumber'

const ConfirmationModal = ({
  confirmation,
}: {
  confirmation?: Confirmation
}) => {
  if (!confirmation) {
    return <></>
  }

  return createPortal(
    <div className="flex items-center justify-center fixed inset-0 bg-black bg-opacity-50 z-[1000] backdrop-blur-sm px-4 sm:px-0">
      <div
        className="flex flex-col w-full sm:w-fit min-w-[320px] bg-gray-800 text-white rounded-xl sm:rounded-2xl p-4 gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="font-bold">{confirmation.title}</div>
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-green-500 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            />
          </div>
          {confirmation.body && (
            <div className="text-xs sm:text-sm text-gray-500">
              {confirmation.body}
            </div>
          )}
        </div>
        <div className="flex text-xs sm:text-sm text-gray-50 items-center justify-between">
          {confirmation.chain ? (
            <>
              Chain
              <div className="flex flex-row gap-1 items-center">
                <ChainIcon chain={confirmation.chain} className="w-4 h-4" />
                {confirmation.chain.name}
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {confirmation.fields.map((field, index) => (
            <div key={index} className="flex flex-row gap-1">
              {field.direction === 'in' ? (
                <div className="flex text-sm sm:text-base w-9 items-center justify-center bg-red-500 bg-opacity-10 font-bold text-red-500 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 12 4"
                    fill="none"
                    className="stroke-red-500 w-2 sm:w-3 h-1"
                  >
                    <path
                      d="M1.66669 2H20.3334"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                <></>
              )}
              {field.direction === 'out' ? (
                <div className="flex text-sm sm:text-base w-9 items-center justify-center bg-green-500 bg-opacity-10 font-bold text-green-500 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="stroke-green-500 w-3 h-3 sm:w-4 sm:h-4"
                  >
                    <path
                      d="M8.00001 3.33331V12.6666M3.33334 7.99998H12.6667"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                <></>
              )}
              <div className="flex w-full items-center justify-between bg-gray-700 px-3 py-1.5 text-sm rounded-lg">
                <div className="flex items-center gap-2 truncate">
                  {field.currency && confirmation.chain ? (
                    <CurrencyIcon
                      chain={confirmation.chain}
                      currency={field.currency}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <></>
                  )}
                  <div>{field.label}</div>
                </div>
                <div>
                  {/^\d{1,3}(,\d{3})*(\.\d+)?$|^\d+(\.\d+)?$/.test(field.value)
                    ? formatWithCommas(field.value)
                    : field.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ConfirmationModal
