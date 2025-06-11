import React from 'react'

import { Transaction } from '../../contexts/transaction-context'
import { CurrencyIcon } from '../icon/currency-icon'

const UserTransactionCard = ({
  transaction,
  isPending,
}: {
  transaction: Transaction
  isPending: boolean
}) => {
  const explorerUrl = transaction.chain?.blockExplorers?.default.url ?? ''
  return (
    <button
      className="self-stretch pt-1 pb-2 flex flex-col w-full justify-start items-start gap-3 cursor-pointer"
      onClick={() =>
        explorerUrl &&
        window.open(`${explorerUrl}/tx/${transaction.txHash}`, '_blank')
      }
    >
      <div className="self-stretch flex justify-between items-center gap-0.5">
        <div className="justify-center text-white text-start text-xs sm:text-sm font-semibold mr-auto text-nowrap overflow-x-scroll">
          {transaction.title}
        </div>
        <div className="flex justify-start items-center gap-2 ml-auto">
          <div className="flex flex-row gap-2 items-center">
            {isPending ? (
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-green-500 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              />
            ) : transaction.success ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <rect
                  x="0.75"
                  y="0.75"
                  width="14.5"
                  height="14.5"
                  rx="7.25"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                />
                <path
                  d="M4 7.76923L7.2 11L12 5"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.75"
                  y="0.75"
                  width="14.5"
                  height="14.5"
                  rx="7.25"
                  stroke="#F94E5C"
                  strokeWidth="1.5"
                />
                <path d="M5 5L11 11" stroke="#F94E5C" strokeWidth="1.5" />
                <path d="M11 5L5 11" stroke="#F94E5C" strokeWidth="1.5" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {transaction.fields.length > 0 && (
        <div className="self-stretch flex flex-col justify-start items-start gap-1 text-white">
          <div className="flex flex-1 w-full self-stretch justify-start items-start gap-1">
            <div className="flex flex-col justify-center items-start gap-1 w-full">
              {transaction.fields
                .filter(
                  (field) =>
                    field.direction !== 'in' && field.direction !== 'out',
                )
                .map((field, index) => (
                  <div
                    key={`transaction-${transaction.txHash}-in-${index}`}
                    className="flex w-full items-center justify-between bg-gray-800 px-2 py-1.5 text-xs rounded-lg"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {field.currency ? (
                        <CurrencyIcon
                          chain={transaction.chain}
                          currency={field.currency}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <></>
                      )}
                      <div className="flex overflow-hidden">{field.label}</div>
                    </div>
                    <div className="flex overflow-hidden">{field.value}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-1 w-full self-stretch justify-start items-start gap-1">
            {transaction.fields.filter((field) => field.direction === 'in')
              .length > 0 && (
              <div className="flex text-sm w-9 items-center justify-center bg-red-500 bg-opacity-10 font-bold text-red-500 rounded-lg h-7">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 12 4"
                  fill="none"
                  className="stroke-red-500 w-2 h-1"
                >
                  <path
                    d="M1.66669 2H20.3334"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            <div className="flex flex-col justify-center items-start gap-1 w-full">
              {transaction.fields
                .filter((field) => field.direction === 'in')
                .map((field, index) => (
                  <div
                    key={`transaction-${transaction.txHash}-in-${index}`}
                    className="flex w-full items-center justify-between bg-gray-800 px-2 py-1.5 text-xs rounded-lg"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {field.currency ? (
                        <CurrencyIcon
                          chain={transaction.chain}
                          currency={field.currency}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <></>
                      )}
                      <div className="flex overflow-hidden">{field.label}</div>
                    </div>
                    <div className="flex overflow-hidden">{field.value}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-1 w-full self-stretch justify-start items-start gap-1">
            {transaction.fields.filter((field) => field.direction === 'out')
              .length > 0 && (
              <div className="flex text-sm w-9 items-center justify-center bg-green-500 bg-opacity-10 font-bold text-green-500 rounded-lg h-7">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="stroke-green-500 w-3 h-3"
                >
                  <path
                    d="M8.00001 3.33331V12.6666M3.33334 7.99998H12.6667"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            <div className="flex flex-col justify-center items-start gap-1 w-full">
              {transaction.fields
                .filter((field) => field.direction === 'out')
                .map((field, index) => (
                  <div
                    key={`transaction-${transaction.txHash}-out-${index}`}
                    className="flex w-full items-center justify-between bg-gray-800 px-2 py-1.5 text-xs rounded-lg"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {field.currency ? (
                        <CurrencyIcon
                          chain={transaction.chain}
                          currency={field.currency}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <></>
                      )}
                      <div className="flex overflow-hidden">{field.label}</div>
                    </div>
                    <div className="flex overflow-hidden">{field.value}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </button>
  )
}

export default UserTransactionCard
