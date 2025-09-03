import React from 'react'

export const Toggle = ({
  disabled,
  defaultChecked,
  onChange,
}: {
  disabled: boolean
  defaultChecked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        disabled={disabled}
        defaultChecked={defaultChecked}
        onChange={onChange}
      />
      <div className="relative w-7 sm:w-11 h-4 sm:h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-0 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 sm:after:h-5 after:w-3 sm:after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
    </label>
  )
}
