import React from 'react'

const loading = () => {
  return (
     <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      {/* Spinner container */}
      <div className="flex flex-col items-center">
        {/* Animated circle spinner */}
        <div className="w-16 h-16 border-4 border-t-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
        
        {/* Text under spinner */}
        <p className="mt-4 text-gray-700 text-lg font-medium animate-pulse">
          Loading Kebele Data...
        </p>
      </div>
    </div>
  )
}

export default loading