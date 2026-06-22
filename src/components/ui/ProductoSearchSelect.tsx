'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Check } from 'lucide-react'

interface Producto {
  id: string
  nombre: string
  unidad: string
}

interface Props {
  productos: Producto[]
  value: string
  onChange: (productId: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  autoFocus?: boolean
}

export function ProductoSearchSelect({
  productos,
  value,
  onChange,
  placeholder = 'Buscar producto...',
  disabled,
  hasError,
  autoFocus,
}: Props) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const selectedProduct = productos.find((p) => p.id === value)

  const filtered =
    query === ''
      ? productos
      : productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(query.toLowerCase()) ||
            p.unidad.toLowerCase().includes(query.toLowerCase()),
        )

  // Cerrar al hacer clic/touch fuera
  const handleOutside = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
        setHighlightedIdx(-1)
        setQuery(selectedProduct?.nombre ?? '')
      }
    },
    [selectedProduct],
  )

  useEffect(() => {
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [handleOutside])

  // Sincronizar query cuando value cambia externamente (p.ej. reset del form)
  useEffect(() => {
    if (!isOpen) setQuery(selectedProduct?.nombre ?? '')
  }, [value, isOpen, selectedProduct])

  // AutoFocus al montar
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Mover foco DOM al item resaltado
  useEffect(() => {
    if (highlightedIdx >= 0) itemRefs.current.get(highlightedIdx)?.focus()
  }, [highlightedIdx])

  function handleSelect(p: Producto) {
    onChange(p.id)
    setQuery(p.nombre)
    setIsOpen(false)
    setHighlightedIdx(-1)
  }

  function handleClear() {
    onChange('')
    setQuery('')
    setIsOpen(false)
    setHighlightedIdx(-1)
    inputRef.current?.focus()
  }

  function handleInputFocus() {
    setQuery('')
    setHighlightedIdx(-1)
    setIsOpen(true)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setIsOpen(true)
    setHighlightedIdx(-1)
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        if (!isOpen) setIsOpen(true)
        if (filtered.length > 0) setHighlightedIdx(0)
        e.preventDefault()
        break
      case 'Enter':
        if (filtered.length === 1) handleSelect(filtered[0])
        else if (highlightedIdx >= 0 && highlightedIdx < filtered.length)
          handleSelect(filtered[highlightedIdx])
        e.preventDefault()
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIdx(-1)
        setQuery(selectedProduct?.nombre ?? '')
        e.preventDefault()
        break
    }
  }

  function handleItemKeyDown(
    e: React.KeyboardEvent<HTMLDivElement>,
    p: Producto,
    i: number,
  ) {
    switch (e.key) {
      case 'ArrowDown':
        if (i < filtered.length - 1) setHighlightedIdx(i + 1)
        e.preventDefault()
        break
      case 'ArrowUp':
        if (i === 0) {
          inputRef.current?.focus()
          setHighlightedIdx(-1)
        } else {
          setHighlightedIdx(i - 1)
        }
        e.preventDefault()
        break
      case 'Enter':
        handleSelect(p)
        e.preventDefault()
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIdx(-1)
        setQuery(selectedProduct?.nombre ?? '')
        inputRef.current?.focus()
        e.preventDefault()
        break
    }
  }

  const borderColor = hasError ? 'hsl(var(--terracota))' : 'hsl(var(--border))'

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input con ícono */}
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'hsl(var(--text-muted))',
            pointerEvents: 'none',
            flexShrink: 0,
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={!isOpen && selectedProduct ? selectedProduct.nombre : placeholder}
          disabled={disabled}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '9px 32px 9px 30px',
            fontSize: 13,
            borderRadius: 8,
            border: `1px solid ${borderColor}`,
            backgroundColor: 'hsl(var(--surface))',
            color: 'hsl(var(--text-main))',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
          }}
        />
        {/* Botón X para limpiar */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--text-muted))',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
            zIndex: 50,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '8px 12px',
                fontSize: 13,
                color: 'hsl(var(--text-muted))',
              }}
            >
              Sin resultados
            </div>
          ) : (
            filtered.map((p, i) => {
              const isSelected = p.id === value
              const isHighlighted = i === highlightedIdx
              return (
                <div
                  key={p.id}
                  tabIndex={0}
                  ref={(el) => {
                    if (el) itemRefs.current.set(i, el)
                    else itemRefs.current.delete(i)
                  }}
                  onClick={() => handleSelect(p)}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    handleSelect(p)
                  }}
                  onKeyDown={(e) => handleItemKeyDown(e, p, i)}
                  onMouseEnter={() => setHighlightedIdx(i)}
                  onMouseLeave={() => setHighlightedIdx(-1)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                    backgroundColor:
                      isSelected || isHighlighted
                        ? 'hsl(var(--surface-alt))'
                        : 'transparent',
                    fontWeight: isSelected ? 600 : 400,
                    color: 'hsl(var(--text-main))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    outline: 'none',
                    userSelect: 'none',
                  }}
                >
                  <span>
                    {p.nombre}{' '}
                    <span
                      style={{
                        color: 'hsl(var(--text-sub))',
                        fontWeight: 400,
                      }}
                    >
                      ({p.unidad})
                    </span>
                  </span>
                  {isSelected && (
                    <Check size={14} color="hsl(var(--green))" strokeWidth={2.5} />
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
