import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "w-full min-w-0 bg-white text-black placeholder:text-gray-400 transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        // Neo Brutalism input
        brutal:
          "border-4 border-black rounded-xl px-4 py-3 shadow-[4px_4px_0px_#000] focus:border-[#FACC15] focus:shadow-[2px_2px_0px_#FACC15] focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-150",
        // Standard input (backwards compatibility)
        default:
          "border border-input rounded-md px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      },
      inputSize: {
        default: "h-12 text-base",
        sm: "h-10 text-sm px-3 py-2",
        lg: "h-14 text-lg px-5 py-4",
      },
      state: {
        default: "",
        error: "border-red-500 focus:border-red-500 focus:shadow-[2px_2px_0px_#EF4444] animate-brutal-shake",
        success: "border-green-500 focus:border-green-500 focus:shadow-[2px_2px_0px_#22C55E]",
      },
    },
    defaultVariants: {
      variant: "brutal",
      inputSize: "default",
      state: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
  VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, state, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, state, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Textarea with brutalist styling
const textareaVariants = cva(
  "w-full min-w-0 bg-white text-black placeholder:text-gray-400 transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        brutal:
          "border-4 border-black rounded-xl px-4 py-3 shadow-[4px_4px_0px_#000] focus:border-[#FACC15] focus:shadow-[2px_2px_0px_#FACC15] focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-150",
        default:
          "border border-input rounded-md px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      },
      state: {
        default: "",
        error: "border-red-500 focus:border-red-500 focus:shadow-[2px_2px_0px_#EF4444] animate-brutal-shake",
        success: "border-green-500 focus:border-green-500 focus:shadow-[2px_2px_0px_#22C55E]",
      },
    },
    defaultVariants: {
      variant: "brutal",
      state: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  VariantProps<typeof textareaVariants> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, state, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, state, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Input, inputVariants, Textarea, textareaVariants }
