import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import api from '../api'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const { user } = useAuth()
  const [locations, setLocations]           = useState([])
  const [currentLocation, setCurrentLocation] = useState(null)
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    if (!user) return
    fetchLocations()
  }, [user])

  async function fetchLocations() {
    try {
      const res = await api.get('/locations')
      setLocations(res.data)

      // Mechanics are locked to their own location
      // Admins/managers default to their assigned location
      // but can switch to any
      const userLocation = res.data.find(
        l => l.location_id === parseInt(user.location_id)
      )
      const saved = localStorage.getItem('selected_location')
      const savedLocation = saved ? res.data.find(
        l => l.location_id === parseInt(saved)
      ) : null

      // Mechanics can't switch — always use their assigned location
      if (user.role === 'mechanic') {
        setCurrentLocation(userLocation || res.data[0])
      } else {
        setCurrentLocation(savedLocation || userLocation || res.data[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function switchLocation(locationId) {
    const loc = locations.find(l => l.location_id === parseInt(locationId))
    if (loc) {
      setCurrentLocation(loc)
      localStorage.setItem('selected_location', locationId)
    }
  }

  return (
    <LocationContext.Provider value={{ locations, currentLocation, switchLocation, loading }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  return useContext(LocationContext)
}