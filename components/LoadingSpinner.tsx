'use client'

import { motion } from 'framer-motion'

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-bl from-orange-100 to-red-100">
      <motion.div
        className="relative w-32 h-32"
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <motion.span
          className="absolute w-full h-full border-4 border-transparent border-t-orange-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.span
          className="absolute w-full h-full border-4 border-transparent border-r-red-500 rounded-full"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      <motion.p
        className="absolute mt-36 text-xl font-semibold text-gray-700"
        animate={{
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        در حال بارگذاری...
      </motion.p>
    </div>
  )
}

