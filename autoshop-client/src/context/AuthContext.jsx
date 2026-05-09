import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
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

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    return (savedToken && savedUser) ? savedToken : null
  })

  function login(userData, tokenData) {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tokenData)
    setUser(userData)
    setToken(tokenData)
    // Removed window.location.href
  }

  function logout() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
    // Removed window.location.href
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