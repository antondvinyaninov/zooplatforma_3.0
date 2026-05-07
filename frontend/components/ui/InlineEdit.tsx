import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Input } from './Input'
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/Command"
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

export interface InlineEditOptions {
  label: string;
  value: string;
}

export interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  type?: 'text' | 'date' | 'select' | 'combobox' | 'number' | 'textarea' | 'custom';
  options?: InlineEditOptions[];
  renderInput?: (props: {
    value: string;
    onChange: (val: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
  }) => React.ReactNode;
  displayValue?: string; // Кастомное отображаемое значение при чтении
}

export function InlineEdit({ value, onSave, placeholder = 'Введите текст...', className, inputClassName, disabled, type = 'text', options, renderInput, displayValue: overrideDisplayValue }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state if external value changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (type !== 'select' && inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    if (currentValue.trim() !== value) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Для type === 'select' используем нативный интерфейс компонента без переключения isEditing
  if (type === 'select') {
    const triggerClass = cn(
      "w-full min-h-[40px] rounded-lg flex items-center justify-between px-3 text-sm text-gray-900 outline-none transition-colors",
      "border border-transparent bg-transparent",
      !disabled && "hover:border-gray-200 hover:bg-gray-50 focus:border-blue-600 focus:bg-white focus:ring-0 focus:shadow-sm data-[state=open]:border-blue-600 data-[state=open]:bg-white data-[state=open]:shadow-sm",
      disabled && "opacity-50 cursor-not-allowed",
      className, inputClassName
    );
    return (
      <div className={cn("relative flex items-center group w-full", className)}>
        <Select 
          value={currentValue}
          onValueChange={(val: string | null) => {
            const strVal = val || '';
            setCurrentValue(strVal);
            onSave(strVal);
          }}
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass}>
            <span className={cn("flex flex-1 text-left truncate", !currentValue && "text-gray-400")}>
              {options?.find(o => String(o.value) === String(currentValue))?.label || placeholder}
            </span>
          </SelectTrigger>
          <SelectContent>
            {options?.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!disabled && (
          <span className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-gray-50/80 rounded pl-2 pointer-events-none">
            <PencilIcon className="w-4 h-4 text-gray-400" />
          </span>
        )}
      </div>
    );
  }

  // Для type === 'combobox' также используем нативный интерфейс
  if (type === 'combobox') {
    const currentLabel = options?.find(o => String(o.value) === String(currentValue))?.label || placeholder;
    const triggerClass = cn(
      "w-full min-h-[40px] rounded-lg flex items-center justify-between px-3 text-sm text-gray-900 outline-none transition-colors cursor-pointer",
      "border border-transparent bg-transparent",
      !disabled && "hover:border-gray-200 hover:bg-gray-50 focus:border-blue-600 focus:bg-white focus:ring-0 focus:shadow-sm data-[state=open]:border-blue-600 data-[state=open]:bg-white data-[state=open]:shadow-sm",
      disabled && "opacity-50 cursor-not-allowed",
      className, inputClassName
    );

    return (
      <div className={cn("relative flex items-center group w-full", className)}>
        <Popover>
          <PopoverTrigger className={triggerClass} disabled={disabled}>
             <span className={cn("flex flex-1 text-left truncate", !currentValue && "text-gray-400")}>
               {currentLabel}
             </span>
             <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50 shrink-0"><path d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819L7.43179 8.56819C7.60753 8.74393 7.89245 8.74393 8.06819 8.56819L10.5682 6.06819C10.7439 5.89245 10.7439 5.60753 10.5682 5.43179C10.3924 5.25605 10.1075 5.25605 9.93179 5.43179L7.5 7.86358L5.06819 5.43179C4.89245 5.25605 4.60753 5.25605 4.43179 5.43179Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          </PopoverTrigger>
          <PopoverContent className="p-0 min-w-[200px]" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start" sideOffset={4}>
            <Command>
              <CommandInput placeholder="Поиск..." autoFocus />
              <CommandList>
                <CommandEmpty>Ничего не найдено.</CommandEmpty>
                <CommandGroup>
                  {options?.map(o => (
                    <CommandItem 
                      key={o.value} 
                      value={o.label} // Для текстового поиска внутри cmdk
                      onSelect={() => {
                        setCurrentValue(o.value);
                        onSave(o.value);
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                      }}
                    >
                      <CheckIcon className={cn("mr-2 h-4 w-4", String(currentValue) === String(o.value) ? "opacity-100" : "opacity-0")} />
                      {o.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {!disabled && (
          <span className="absolute right-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-gray-50/80 rounded pl-2 pointer-events-none">
            <PencilIcon className="w-4 h-4 text-gray-400" />
          </span>
        )}
      </div>
    );
  }

  // type === 'date' больше не перехватывается до isEditing
  
  if (isEditing) {
    const combinedInputClass = cn(
      "pr-16",
      "border border-blue-600 focus-visible:border-blue-600 focus-visible:ring-0 focus:outline-none",
      className, 
      inputClassName
    );
    
    let inputEl = null;
    if (type === 'textarea') {
      inputEl = (
        <textarea
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
            combinedInputClass
          )}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus
        />
      );
    } else if (type === 'custom' && renderInput) {
      inputEl = (
        <>
          {renderInput({
            value: currentValue,
            onChange: setCurrentValue,
            onKeyDown: handleKeyDown,
            disabled,
            className: combinedInputClass,
            placeholder
          })}
        </>
      );
    } else if (type === 'date') {
      let dateObj: Date | undefined = undefined;
      if (currentValue) {
        dateObj = new Date(currentValue);
      }
      inputEl = (
        <div className={cn(
          "flex items-center w-full rounded-md border border-blue-600 bg-white pr-16 min-h-10",
          className, inputClassName
        )}>
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none min-w-0 focus:ring-0 [&::-webkit-calendar-picker-indicator]:hidden" 
            disabled={disabled}
          />
          <Popover>
            <PopoverTrigger className="flex items-center justify-center p-1.5 rounded-md hover:bg-gray-100 text-gray-500 z-10 w-7 h-7 shrink-0 transition-colors mr-1 outline-none">
              <CalendarIcon className="w-4 h-4" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 flex justify-center border-gray-100 rounded-lg shadow-md" align="end" sideOffset={8}>
              <Calendar
                mode="single"
                selected={dateObj}
                onSelect={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    setCurrentValue(`${year}-${month}-${day}`);
                  }
                }}
                locale={ru}
                initialFocus
                captionLayout="dropdown"
                fromYear={1990}
                toYear={new Date().getFullYear() + 5}
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    } else {
      inputEl = (
        <Input
          ref={inputRef}
          type={type}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={combinedInputClass} 
          disabled={disabled}
        />
      );
    }

    return (
      <div className={cn("relative flex items-center group w-full", type === 'textarea' ? 'items-start' : '', className)}>
        {inputEl}
        
        <div className={cn("absolute right-2 flex space-x-1 z-10", type === 'textarea' ? 'top-2 flex-col space-x-0 space-y-1' : 'items-center')}>
          <button 
            type="button" 
            onClick={handleSave}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 rounded-md transition-colors shadow-sm bg-white"
            title="Сохранить"
          >
            <CheckIcon className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={handleCancel}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors shadow-sm bg-white"
            title="Отмена"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Для select пытаемся найти красивое название вместо сырого value
  const displayValue = overrideDisplayValue !== undefined ? overrideDisplayValue : currentValue;

  return (
    <div 
      className={cn(
        // Match exact padding, height, and typography defaults of Input
        "group relative flex items-center w-full min-h-10 rounded-lg border border-transparent px-3 py-2 text-sm text-gray-900 transition-colors",
        !disabled && "hover:border-gray-200 hover:bg-gray-50 cursor-text",
        className
      )}
      onClick={() => !disabled && setIsEditing(true)}
    >
      <span className={cn("truncate w-full", !displayValue && "text-gray-400")}>
        {displayValue || placeholder}
      </span>
      {!disabled && (
        <span className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-gray-50/80 rounded pl-2">
          <PencilIcon className="w-4 h-4 text-gray-400" />
        </span>
      )}
    </div>
  );
}
