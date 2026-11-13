import { useEffect, useState } from "react"

export function useTyped(total: number, speed = 75, delay = 700) {
  const [n, setN] = useState(0)
  // Con "reducir movimiento" el texto aparece completo, sin animar.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    if (reduced) return
    let i = 0
    let iv = 0
    const t = window.setTimeout(() => {
      iv = window.setInterval(() => {
        i++
        setN(i)
        if (i >= total) clearInterval(iv)
      }, speed)
    }, delay)
    return () => {
      clearTimeout(t)
      clearInterval(iv)
    }
  }, [total, speed, delay, reduced])

  return reduced ? total : n
}