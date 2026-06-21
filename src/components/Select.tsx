import { useEffect, useId, useRef, useState } from 'react'
import './Select.css'

type SelectProps = {
  name: string
  options: string[]
  value: string
  onChange: (value: string) => void
  labelId?: string
}

/**
 * Custom dropdown — replaces the native <select> so every part (menu
 * background, hover, and the selected row) follows the site palette. Native
 * <option> highlight colours can't be styled, which is why this exists.
 * A hidden input keeps the value available to the surrounding <form>.
 */
export default function Select({ name, options, value, onChange, labelId }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => Math.max(0, options.indexOf(value)))
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Re-sync the keyboard cursor to the current value whenever the menu opens, so
  // it can't drift out of step after the option list changes (e.g. a language
  // switch replaces `options` while this component stays mounted).
  useEffect(() => {
    if (open) setActive(Math.max(0, options.indexOf(value)))
    // `options` identity changes every render; keying on `open` is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const choose = (opt: string) => {
    onChange(opt)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(options.length - 1, a + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(0, a - 1))
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        choose(options[active])
      }
    }
  }

  return (
    <div className="cselect" ref={rootRef}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className={`cselect-trigger ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span>{value}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="m6 9 6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="cselect-menu" role="listbox" id={listId}>
          {options.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`cselect-option ${opt === value ? 'is-selected' : ''} ${
                i === active ? 'is-active' : ''
              }`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
