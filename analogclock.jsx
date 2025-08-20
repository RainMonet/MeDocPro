import React, { useState, useEffect } from 'react';

// Main App component to display the clock
export default function App() {
  return (
    <div className="bg-[#F5F5DC] min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <AnalogClock />
      </div>
    </div>
  );
}

// The Analog Clock Component
function AnalogClock() {
  // State to hold the current time
  const [time, setTime] = useState(new Date());

  // useEffect hook to set up a timer that updates the time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(timerId);
  }, []); // Empty dependency array means this effect runs only once on mount

  // Extract hours, minutes, and seconds from the current time
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  // --- Rotation Calculations ---
  // Calculate the rotation for the second hand.
  // 60 seconds in a circle (360 degrees). So, each second is 360/60 = 6 degrees.
  const secondHandRotation = seconds * 6;

  // Calculate the rotation for the minute hand.
  // Each minute is 6 degrees. We also add a fraction of a degree for the current second
  // to make the minute hand move smoothly between minutes.
  const minuteHandRotation = minutes * 6 + seconds * 0.1;

  // Calculate the rotation for the hour hand.
  // 12 hours in a circle (360 degrees). So, each hour is 360/12 = 30 degrees.
  // We use modulo 12 to convert 24-hour format to 12-hour.
  // We also add a fraction of a degree for the current minute for smooth movement.
  const hourHandRotation = (hours % 12) * 30 + minutes * 0.5;

  // --- SVG Rendering ---
  // Using viewBox allows the SVG to scale responsively within its container.
  return (
    <div className="relative w-full" style={{ paddingTop: '100%' }}>
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 200 200"
        aria-label="Analog clock showing current time with an earth tone theme"
      >
        {/* Clock Face */}
        <g>
          <circle cx="100" cy="100" r="98" fill="#EADDCA" stroke="#8B4513" strokeWidth="4" />
        </g>

        {/* Hour and Minute Markers */}
        <g>
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`hour-marker-${i}`}
              x1="100"
              y1="10"
              x2="100"
              y2="20"
              stroke="#A0522D"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${i * 30} 100 100)`}
            />
          ))}
          {Array.from({ length: 60 }).map((_, i) => (
             i % 5 !== 0 && (
                <line
                  key={`minute-marker-${i}`}
                  x1="100"
                  y1="10"
                  x2="100"
                  y2="15"
                  stroke="#BC8F8F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  transform={`rotate(${i * 6} 100 100)`}
                />
             )
          ))}
        </g>

        {/* Hour Hand */}
        <g>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="55"
            stroke="#654321"
            strokeWidth="7"
            strokeLinecap="round"
            transform={`rotate(${hourHandRotation} 100 100)`}
          />
        </g>

        {/* Minute Hand */}
        <g>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke="#8B4513"
            strokeWidth="5"
            strokeLinecap="round"
            transform={`rotate(${minuteHandRotation} 100 100)`}
          />
        </g>

        {/* Second Hand */}
        <g>
          <line
            x1="100"
            y1="110"
            x2="100"
            y2="25"
            stroke="#D2B48C"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${secondHandRotation} 100 100)`}
          />
        </g>
        
        {/* Center Pivot Point */}
        <g>
            <circle cx="100" cy="100" r="5" fill="#654321" />
        </g>
      </svg>
    </div>
  );
}
