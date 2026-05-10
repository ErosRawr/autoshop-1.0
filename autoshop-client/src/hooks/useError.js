import { useState } from 'react'

export function useError() {
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  function showError(msg) {
    setError(msg)
    setSuccess(null)
    setTimeout(() => setError(null), 5000)
  }

  function showSuccess(msg) {
    setSuccess(msg)
    setError(null)
    setTimeout(() => setSuccess(null), 3000)
  }

  function clearMessages() {
    setError(null)
    setSuccess(null)
  }

  return { error, success, showError, showSuccess, clearMessages }
}