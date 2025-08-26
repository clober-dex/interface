import React from 'react'
import clsx from 'clsx'

export const PageButton = ({
  disabled,
  onClick,
  children,
  className,
}: {
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'group flex flex-row gap-2 items-center text-gray-500 disabled:text-white stroke-gray-500 fill-gray-500 disabled:stroke-blue-500 disabled:fill-blue-500 rounded-[10px] disabled:bg-[#367fff]/20 p-2 font-semibold md:text-sm md:font-medium',
        className,
      )}
    >
      {children}
    </button>
  )
}
