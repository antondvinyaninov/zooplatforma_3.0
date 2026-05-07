import * as React from 'react'
import { Checkbox as HeadlessCheckbox } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/16/solid'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, disabled, className }: CheckboxProps) {
  return (
    <HeadlessCheckbox
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "group flex h-5 w-5 items-center justify-center rounded border bg-white shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 data-[checked]:bg-indigo-600 data-[checked]:ring-indigo-600 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 transition-colors",
        className
      )}
    >
      {/* heroicons CheckIcon */}
      <CheckIcon className="hidden h-4 w-4 text-white group-data-[checked]:block" strokeWidth={3} />
    </HeadlessCheckbox>
  )
}
