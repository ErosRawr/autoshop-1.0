import { useState } from 'react'

export function usePagination(data, pageSize = 20) {
  const [page, setPage] = useState(1)
  const totalPages      = Math.ceil(data.length / pageSize)
  const paginated       = data.slice((page - 1) * pageSize, page * pageSize)

  function nextPage() { setPage(p => Math.min(p + 1, totalPages)) }
  function prevPage() { setPage(p => Math.max(p - 1, 1)) }
  function goToPage(n) { setPage(Math.max(1, Math.min(n, totalPages))) }
  function reset() { setPage(1) }

  return { page, totalPages, paginated, nextPage, prevPage, goToPage, reset }
}