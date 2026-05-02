import { useState } from 'react'

export function useSort(defaultKey, defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  function toggle(key) {
    if (key !== sortKey) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      // 3rd click — reset to default
      setSortKey(defaultKey)
      setSortDir(defaultDir)
    }
  }

  function sort(data) {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey] ?? ''
      const bVal = b[sortKey] ?? ''
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  }

  function indicator(key) {
    if (key !== sortKey) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  return { sortKey, sortDir, toggle, sort, indicator }
}