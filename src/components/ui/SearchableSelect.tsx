'use client'
import { useState, useEffect, useRef } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  options: SelectOption[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  id?: string
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Escribir para buscar...', className = '', id }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Initialize or reset internal search text depending on selected value
  useEffect(() => {
    if (value) {
      const selected = options.find(o => o.value === value)
      if (selected) {
        setSearch(selected.label)
      } else {
        setSearch(value) // Fallback in case options haven't loaded yet
      }
    } else {
      setSearch('')
    }
  }, [value, options])

  // Click outside to close and rollback
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
        const selected = options.find(o => o.value === value)
        if (selected && search !== selected.label) {
          setSearch(selected.label) // Reset to standard label if they clicked away
        } else if (!selected) {
          setSearch('')
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [wrapperRef, value, options, search])

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    String(o.value).toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50)

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        id={id}
        type="text"
        value={search}
        onChange={e => {
          setSearch(e.target.value)
          setOpen(true)
          if (value !== '') onChange('') // Invalidate parent value while searching
        }}
        onFocus={() => {
          setOpen(true)
          setSearch('') // Clear search on focus to quickly show options
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      />
      {open && (
        <ul className="absolute z-30 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (
            <li
              key={`${opt.value}-${i}`}
              className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-white border-b border-slate-700/50 last:border-0"
              onClick={() => {
                onChange(opt.value)
                setSearch(opt.label)
                setOpen(false)
              }}
            >
              {opt.label}
            </li>
          )) : (
            <li className="px-3 py-2 text-sm text-slate-500 italic">Sin coincidencias</li>
          )}
        </ul>
      )}
    </div>
  )
}
