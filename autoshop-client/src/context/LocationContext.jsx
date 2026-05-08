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

      const savedId = localStorage.getItem('selected_location')
      
      // Find the specific location assigned to the user in the DB
      const userLoc = locs.find(l => String(l.location_id) === String(user.location_id))
      
      // Find the location they previously had selected in the browser
      const savedLoc = savedId ? locs.find(l => String(l.location_id) === String(savedId)) : null

      // LOCKING LOGIC:
      // Only admins are allowed to roam. 
      // Receptionists and Mechanics are forced to their user.location_id.
      if (user.role === 'admin') {
        setCurrentLocation(savedLoc || userLoc || locs[0])
      } else {
        setCurrentLocation(userLoc || locs[0])
      }
      
    } catch (err) {
      console.error('Error fetching locations:', err)
    } finally {
      setLoading(false)
    }
  }

  function switchLocation(locationId) {
    // Permission check: Prevent non-admins from switching even if they trigger the function
    if (user.role !== 'admin') {
      console.warn('Unauthorized location switch attempt.')
      return
    }

    const loc = locations.find(l => String(l.location_id) === String(locationId))
    if (loc) {
      setCurrentLocation(loc)
      localStorage.setItem('selected_location', String(loc.location_id))
    }
  }

  return (
    <LocationContext.Provider value={{ 
      locations, 
      currentLocation, 
      switchLocation, 
      loading 
    }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}