"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'min' | 'max' | 'step' | 'onChange'> {
    value?: number[]
    onValueChange?: (value: number[]) => void
    max?: number
    min?: number
    step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value = [50], onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
        const isSingleValue = value.length === 1
        const [localValue, setLocalValue] = React.useState(value)
        const currentValue = value || localValue

        const handleSingleChange = (newValue: number) => {
            const newValues = [newValue]
            setLocalValue(newValues)
            onValueChange?.(newValues)
        }

        const handleRangeChange = (index: number, newValue: number) => {
            const newValues = [...currentValue]
            newValues[index] = newValue

            // Ensure min doesn't exceed max and vice versa
            if (index === 0 && newValue > currentValue[1]) {
                newValues[0] = currentValue[1]
            }
            if (index === 1 && newValue < currentValue[0]) {
                newValues[1] = currentValue[0]
            }

            setLocalValue(newValues)
            onValueChange?.(newValues)
        }

        const getPercent = (val: number) => ((val - min) / (max - min)) * 100

        // Single value slider (simple slider)
        if (isSingleValue) {
            return (
                <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
                    <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
                        <div
                            className="absolute h-full bg-primary"
                            style={{
                                left: 0,
                                width: `${getPercent(currentValue[0])}%`
                            }}
                        />
                    </div>
                    <input
                        ref={ref}
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={currentValue[0]}
                        onChange={(e) => handleSingleChange(Number(e.target.value))}
                        className="absolute w-full h-2 opacity-0 cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                        {...props}
                    />
                    {/* Single thumb indicator */}
                    <div
                        className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 pointer-events-none"
                        style={{ left: `calc(${getPercent(currentValue[0])}% - 10px)` }}
                    />
                </div>
            )
        }

        // Dual range slider
        return (
            <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
                <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
                    <div
                        className="absolute h-full bg-primary"
                        style={{
                            left: `${getPercent(currentValue[0])}%`,
                            right: `${100 - getPercent(currentValue[1])}%`
                        }}
                    />
                </div>
                <input
                    ref={ref}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue[0]}
                    onChange={(e) => handleRangeChange(0, Number(e.target.value))}
                    className="absolute w-full h-2 opacity-0 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                    {...props}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue[1]}
                    onChange={(e) => handleRangeChange(1, Number(e.target.value))}
                    className="absolute w-full h-2 opacity-0 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                />
                {/* Thumb indicators */}
                <div
                    className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 pointer-events-none"
                    style={{ left: `calc(${getPercent(currentValue[0])}% - 10px)` }}
                />
                <div
                    className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 pointer-events-none"
                    style={{ left: `calc(${getPercent(currentValue[1])}% - 10px)` }}
                />
            </div>
        )
    }
)
Slider.displayName = "Slider"

export { Slider }

