import React, { useState, useEffect, useRef } from 'react'
import { searchCustomers, type Customer } from '../../api/customers'
import { Search } from 'lucide-react'

interface CustomerSearchInputProps {
  value: string
  label: string
  error?: string
  onChange: (name: string, phone: string, email: string, address: string, customerId?: string) => void
}

export function CustomerSearchInput({ value, label, error, onChange }: CustomerSearchInputProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Customer[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const delayDebounce = setTimeout(() => {
      setLoading(true)
      searchCustomers(query)
        .then((customers) => {
          setResults(customers)
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false))
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (customer: Customer) => {
    onChange(
      customer.name,
      customer.phone,
      customer.email || '',
      customer.address || '',
      customer.id
    )
    setQuery(customer.name)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value
    setQuery(nextVal)
    onChange(nextVal, '', '', '', undefined)
    setIsOpen(true)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type="text"
          className="input pr-9"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search existing customer by name/phone/email..."
          data-testid="ro-customer-name"
        />
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          {loading ? (
            <div className="px-4 py-2 text-xs text-slate-500">Searching...</div>
          ) : (
            results.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex flex-col transition"
                onClick={() => handleSelect(customer)}
              >
                <span className="font-semibold text-slate-900">{customer.name}</span>
                <span className="text-xs text-slate-500">
                  {customer.phone} {customer.email ? `· ${customer.email}` : ''}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
