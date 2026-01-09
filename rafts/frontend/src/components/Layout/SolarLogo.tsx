import React from 'react'

const SolarSystem = () => {
  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      className={`solar-system`}
    >
      {/* Outer orbit */}
      <circle
        cx="512"
        cy="512"
        r="330"
        fill="none"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
        strokeDasharray="1070 150"
      />

      {/* Inner orbit */}
      <circle
        cx="512"
        cy="512"
        r="220"
        fill="none"
        stroke="var(--orbit-color)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="1260 120"
      />

      {/* Sun in center */}
      <circle cx="512" cy="512" r="80" fill="#FDB813" />

      {/* Sun rays */}
      <line
        x1="512"
        y1="350"
        x2="512"
        y2="392"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="512"
        y1="632"
        x2="512"
        y2="674"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="350"
        y1="512"
        x2="392"
        y2="512"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="632"
        y1="512"
        x2="674"
        y2="512"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />

      <line
        x1="392"
        y1="392"
        x2="422"
        y2="422"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="602"
        y1="602"
        x2="632"
        y2="632"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="392"
        y1="632"
        x2="422"
        y2="602"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="602"
        y1="422"
        x2="632"
        y2="392"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* Earth with continents */}
      <circle cx="200" cy="405" r="50" fill="#0077BE" />

      {/* Venus/Mercury */}
      <circle cx="720" cy="450" r="40" fill="#F3E5AB" />
    </svg>
  )
}

export default SolarSystem
