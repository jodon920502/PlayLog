import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface SortOption {
  value: string
  label: string
}

interface SortDropdownProps {
  value: string
  options: SortOption[]
  onChange: (value: string) => void
  ariaLabel?: string
}

export default function SortDropdown({ value, options, onChange, ariaLabel = '排序' }: SortDropdownProps) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const listboxRef = useRef<HTMLDivElement | null>(null)
  const listboxId = `${ariaLabel.replace(/\s+/g, '-')}-options`
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selectedOption = options[selectedIndex]

  useEffect(() => {
    setHighlightedIndex(selectedIndex)
  }, [selectedIndex])

  useEffect(() => {
    if (open) listboxRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const selectOption = (option: SortOption) => {
    onChange(option.value)
    setOpen(false)
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen((current) => !current)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setHighlightedIndex((current) => {
        const next = event.key === 'ArrowDown' ? current + 1 : current - 1
        return (next + options.length) % options.length
      })
    }
  }

  const handleListboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((current) => {
        const next = event.key === 'ArrowDown' ? current + 1 : current - 1
        return (next + options.length) % options.length
      })
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const option = options[highlightedIndex]
      if (option) selectOption(option)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative z-20">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        className="flex min-w-[132px] items-center justify-between gap-3 rounded-lg border border-white/[.08] bg-[#151821] px-3 py-2 text-sm text-[#eeece5] outline-none transition hover:border-[#f2c544]/60 focus:border-[#f2c544] focus:ring-2 focus:ring-[#f2c544]/20"
      >
        <span>{selectedOption?.label ?? ''}</span>
        <ChevronDown size={15} className={`shrink-0 text-[#f2c544] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id={listboxId}
          ref={listboxRef}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={handleListboxKeyDown}
          onMouseEnter={() => setHighlightedIndex(selectedIndex)}
          className="absolute right-0 top-full z-50 mt-2 min-w-full overflow-hidden rounded-lg border border-white/[.1] bg-[#10151d] p-1 shadow-2xl shadow-black/40 outline-none"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isHighlighted = index === highlightedIndex
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  isHighlighted || isSelected
                    ? 'bg-[#f2c544] text-[#10120f]'
                    : 'text-[#d9d7d0] hover:bg-white/10 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
