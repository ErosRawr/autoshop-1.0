import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const [token, setToken] = useState(() => localStorage.getItem('token'))

  function login(userData, tokenData) {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tokenData)
    setToken(tokenData)
    window.location.href = '/'
  }

  function logout() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — lets any component access auth with one line
export function useAuth() {
  return useContext(AuthContext)
}