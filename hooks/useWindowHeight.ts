import { useEffect, useState } from 'react'

export const useWindowHeight = () => {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const handleResize = () => setHeight(window.innerHeight)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return height
}
