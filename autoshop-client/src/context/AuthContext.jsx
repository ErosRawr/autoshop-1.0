import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Enhanced initializer: Checks for existence AND expiry
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      // Decode the JWT payload (the middle part of the token)
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      // JWT expiry (exp) is in seconds, Date.now() is in milliseconds
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return null
      }
    } catch (e) {
      // If the token is malformed, clear everything
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return null
    }

    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const [token, setToken] = useState(() => {
    // Sync token state with the same logic as user
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    return (savedToken && savedUser) ? savedToken : null
  })

  function login(userData, tokenData) {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tokenData)
    setUser(userData)
    setToken(tokenData)
    window.location.href = '/'
  }

  function logout() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
    window.location.href = '/login'
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