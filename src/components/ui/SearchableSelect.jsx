import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

/**
 * Dependency-free searchable combobox. The dropdown is portalled to <body> with
 * position:fixed so it is never clipped by card overflow or transforms.
 * options: [{ value, label, sublabel? }]. onChange receives String(value).
 */
export default function SearchableSelect({
  options = [], value, onChange, placeholder = 'Select…',
  disabled = false, required = false, emptyText = 'No matches',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [rect, setRect] = useState(null)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) =>
      `${o.label} ${o.sublabel || ''}`.toLowerCase().includes(q))
  }, [options, query])

  // Track the input position so the fixed menu stays anchored — and size it to
  // the space actually available, flipping above the field when there's more
  // room up top. Prevents the menu from running off the bottom of the viewport
  // (where a position:fixed list can't be scrolled into view).
  useEffect(() => {
    if (!open) return
    const update = () => {
      if (!wrapRef.current) return
      const r = wrapRef.current.getBoundingClientRect()
      const margin = 10
      const spaceBelow = window.innerHeight - r.bottom - margin
      const spaceAbove = r.top - margin
      const openUp = spaceBelow < 240 && spaceAbove > spaceBelow
      const avail = Math.max(160, Math.min(380, openUp ? spaceAbove : spaceBelow))
      setRect({
        left: r.left,
        width: r.width,
        openUp,
        top: openUp ? undefined : r.bottom + 4,
        bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
        maxH: avail,
      })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target) &&
          !document.getElementById('cl-ss-menu')?.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function choose(opt) {
    onChange(String(opt.value))
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="cl-ss" ref={wrapRef}>
      <div
        className={`form-control cl-ss-control ${disabled ? 'disabled' : ''}`}
        onClick={() => { if (!disabled) { setOpen((o) => !o); setTimeout(() => inputRef.current?.focus(), 0) } }}
      >
        <span className={selected ? '' : 'text-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="cl-ss-icons">
          {selected && !disabled && (
            <button type="button" className="cl-ss-clear" onClick={(e) => { e.stopPropagation(); onChange('') }}
              aria-label="Clear">
              <i className="bi bi-x" />
            </button>
          )}
          <i className="bi bi-chevron-down" />
        </span>
      </div>

      {/* Hidden proxy so native required-validation works inside forms. */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          value={value || ''}
          onChange={() => {}}
          required
          style={{ opacity: 0, height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }}
        />
      )}

      {open && rect && createPortal(
        <div id="cl-ss-menu" className="cl-ss-menu"
          style={{
            position: 'fixed', left: rect.left, width: rect.width, zIndex: 2000,
            ...(rect.openUp ? { bottom: rect.bottom } : { top: rect.top }),
            maxHeight: rect.maxH, display: 'flex', flexDirection: 'column',
          }}>
          <div className="cl-ss-search">
            <i className="bi bi-search" />
            <input ref={inputRef} value={query} placeholder="Search…"
              onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="cl-ss-list" style={{ maxHeight: rect.maxH - 52 }}>
            {filtered.length === 0 && <div className="cl-ss-empty">{emptyText}</div>}
            {filtered.map((o) => (
              <button type="button" key={o.value}
                className={`cl-ss-option ${String(o.value) === String(value) ? 'active' : ''}`}
                onClick={() => choose(o)}>
                <span className="cl-ss-label">{o.label}</span>
                {o.sublabel && <span className="cl-ss-sub">{o.sublabel}</span>}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
