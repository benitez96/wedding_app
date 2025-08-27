'use client'

import { useState, useEffect } from 'react'
import { Button, Input } from '@heroui/react'
import { Minus, Plus } from 'lucide-react'

interface GuestCountSelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export default function GuestCountSelector({ 
  value, 
  onChange, 
  min = 1, 
  max = 10, 
  disabled = false 
}: GuestCountSelectorProps) {
  const [inputValue, setInputValue] = useState(value.toString())

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleDecrease = () => {
    if (!disabled && value > min) {
      const newValue = value - 1
      onChange(newValue)
      setInputValue(newValue.toString())
    }
  }

  const handleIncrease = () => {
    if (!disabled && value < max) {
      const newValue = value + 1
      onChange(newValue)
      setInputValue(newValue.toString())
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    const numValue = parseInt(newValue) || min
    const clampedValue = Math.max(min, Math.min(max, numValue))
    
    if (clampedValue !== value) {
      onChange(clampedValue)
    }
  }

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue) || min
    const clampedValue = Math.max(min, Math.min(max, numValue))
    onChange(clampedValue)
    setInputValue(clampedValue.toString())
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={handleDecrease}
        isDisabled={disabled || value <= min}
        className="min-w-[40px] h-[40px]"
      >
        <Minus className="w-4 h-4" />
      </Button>
      
      <Input
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        min={min}
        max={max}
        disabled={disabled}
        className="w-20 text-center"
        classNames={{
          input: "text-center text-lg font-semibold",
          inputWrapper: "h-[40px]"
        }}
      />
      
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={handleIncrease}
        isDisabled={disabled || value >= max}
        className="min-w-[40px] h-[40px]"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  )
}
