import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  debounceMs = 750, // Prevents rapid duplicate clicks
}) {
  const lastClickRef = useRef(0)
  const [internalBusy, setInternalBusy] = useState(false)

  const isLocked = disabled || loading || internalBusy

  const handleClick = async (e) => {
    if (isLocked) {
      e?.preventDefault?.()
      return
    }

    const now = Date.now()
    // Debounce / rebound cooldown check
    if (now - lastClickRef.current < debounceMs) {
      e?.preventDefault?.()
      return
    }
    lastClickRef.current = now

    if (onClick) {
      try {
        const result = onClick(e)
        // If the handler returns a Promise (async API call), lock until completion
        if (result && typeof result.then === 'function') {
          setInternalBusy(true)
          await result
        }
      } finally {
        setInternalBusy(false)
      }
    }
  }

  const base =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

  const variants = {
    primary: 'bg-clay text-canvas hover:bg-brick shadow-soft active:scale-[0.98]',
    secondary: 'bg-canvas text-ink border border-ink/15 hover:bg-sand/60 shadow-sm active:scale-[0.98]',
    outline: 'bg-transparent text-ink border border-ink/20 hover:bg-sand/40',
    ghost: 'bg-transparent text-ink/70 hover:text-ink hover:bg-sand/50',
    danger: 'bg-brick text-canvas hover:opacity-90 shadow-sm',
  }

  const sizes = {
    sm: 'px-4 py-1.5 text-xs gap-1.5',
    md: 'px-6 py-2.5 text-sm gap-2',
    lg: 'px-8 py-3.5 text-base gap-2.5',
  }

  return (
    <button
      type={type}
      disabled={isLocked}
      onClick={handleClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {(loading || internalBusy) && (
        <Loader2 size={size === 'sm' ? 12 : 15} className="animate-spin shrink-0" />
      )}
      {children}
    </button>
  )
}
