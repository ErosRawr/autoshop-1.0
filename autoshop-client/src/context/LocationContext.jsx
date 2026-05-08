import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import api from '../api'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const { user } = useAuth()
  const [locations, setLocations]             = useState([])
  const [currentLocation, setCurrentLocation] = useState(null)
  const [loading, setLoading]                 = useState(true)

  useEffect(() => {
    if (!user) return
    fetchLocations()
  }, [user])

  async function fetchLocations() {
    try {
      const res = await api.get('/locations')
      const locs = res.data
      setLocations(locs)

      // Use String() everywhere — pg returns bigserial as strings
      const saved       = localStorage.getItem('selected_location')
      const userLoc     = locs.find(l => String(l.location_id) === String(user.location_id))
      const savedLoc    = saved ? locs.find(l => String(l.location_id) === String(saved)) : null

      if (user.role === 'mechanic') {
        setCurrentLocation(userLoc || locs[0])
      } else {
        setCurrentLocation(savedLoc || userLoc || locs[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function switchLocation(locationId) {
    // String() comparison — avoids "1" === 1 always being false
    const loc = locations.find(l => String(l.location_id) === String(locationId))
    if (loc) {
      setCurrentLocation(loc)
      localStorage.setItem('selected_location', String(locationId))
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