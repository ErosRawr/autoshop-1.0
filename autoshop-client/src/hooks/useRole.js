import { useAuth } from '../context/AuthContext'
export function useRole(...roles) {
  const { user } = useAuth()
  return roles.includes(user?.role)
}