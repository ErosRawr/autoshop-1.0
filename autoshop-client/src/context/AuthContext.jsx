import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Initialize user state from localStorage
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      // Check for token expiration
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return null
      }
    } catch (e) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return null
    }

    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  // Initialize token state from localStorage
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    return (savedToken && savedUser) ? savedToken : null
  })

  function login(userData, tokenData) {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tokenData)
    // Update state to trigger reactivity
    setUser(userData)
    setToken(tokenData)
  }

  function logout() {
    // Clear storage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    
    // FIX 3: Explicitly set state to null to clear stale data and trigger re-render
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}