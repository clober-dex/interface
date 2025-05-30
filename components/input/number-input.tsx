import React, { useCallback } from 'react'

const NumberInput = ({
  value,
  onValueChange,
  supportNegative = false,
  maxLength = 15,
  ...props
}: {
  value: string
  onValueChange: (value: string) => void
  supportNegative?: boolean
  maxLength?: number
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value.replace(/[,a-zA-Z]/g, '')

      const regex = supportNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/
      if (regex.test(newValue)) {
        if (newValue.length <= maxLength) {
          onValueChange(newValue)
        }
      }
    },
    [maxLength, onValueChange, supportNegative],
  )
  return <input value={value} onChange={handleChange} {...props} />
}

export default NumberInput
