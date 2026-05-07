import * as React from 'react'
import { Dialog as HeadlessDialog, DialogPanel, DialogTitle as HeadlessDialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  preventOutsideClose?: boolean;
}

export function Dialog({ open, onClose, children, className, preventOutsideClose = false }: DialogProps) {
  return (
    <Transition appear show={open} as={React.Fragment}>
      <HeadlessDialog 
        as="div" 
        className="relative z-50" 
        onClose={preventOutsideClose ? () => {} : onClose}
      >
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel 
                className={cn(
                  "w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all", 
                  className
                )}
              >
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  )
}

export const DialogTitle = ({ 
  children, 
  onClose, 
  className 
}: { 
  children: React.ReactNode; 
  onClose?: () => void; 
  className?: string 
}) => (
  <HeadlessDialogTitle as="h3" className={cn("text-xl font-bold leading-6 text-gray-900 mb-4 flex justify-between items-center", className)}>
    {children}
    {onClose && (
      <button
        type="button"
        className="rounded-lg p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600"
        onClick={onClose}
      >
        <XMarkIcon className="h-6 w-6" />
      </button>
    )}
  </HeadlessDialogTitle>
)

export const DialogFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("mt-6 flex justify-end gap-3", className)}>
    {children}
  </div>
)
