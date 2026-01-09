import React from 'react'

const SolarSystemResearchLogo = () => {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="60" height="60" fill="#0A0F2D" />

      {/* Sun */}
      <circle cx="30" cy="30" r="10" fill="#FFA500" stroke="#FFD700" strokeWidth="2" />

      {/* Planetary Orbits */}
      <circle cx="30" cy="30" r="20" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.5" />
      <circle cx="30" cy="30" r="30" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.5" />

      {/* Planets */}
      <circle cx="45" cy="30" r="3" fill="#FFFFFF" />
      <circle cx="30" cy="60" r="3" fill="#FFFFFF" />
    </svg>
  )
}

export default SolarSystemResearchLogo
