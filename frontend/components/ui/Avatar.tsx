import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ src, alt = "Avatar", fallback = "?", size = 'md', className, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl'
  }

  const [imageError, setImageError] = React.useState(false)

  return (
    <div 
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-gray-100 items-center justify-center border border-gray-200",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <Image 
          src={src} 
          alt={alt} 
          fill 
          className="aspect-square h-full w-full object-cover" 
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-semibold text-gray-500 uppercase">
          {fallback.substring(0, 2)}
        </span>
      )}
    </div>
  )
}
