'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

export const LOCAL_LIMIT = 5
export const LOCAL_WINDOW_MS = 60_000

type State = {
  blocked: boolean
  waitSeconds: number
  remaining: number
}

export function useLocalRateLimit(limit = LOCAL_LIMIT, windowMs = LOCAL_WINDOW_MS) {
  const stamps = useRef<number[]>([])
  const [state, setState] = useState<State>({
    blocked: false,
    waitSeconds: 0,
    remaining: limit,
  })

  const recompute = useCallback(() => {
    const now = Date.now()
    stamps.current = stamps.current.filter((t) => now - t < windowMs)

    const count = stamps.current.length
    if (count < limit) {
      setState({blocked: false, waitSeconds: 0, remaining: limit - count})
      return
    }

    const oldest = stamps.current[0]
    const wait = Math.max(0, Math.ceil((oldest + windowMs - now) / 1000))
    setState({blocked: true, waitSeconds: wait, remaining: 0})
  }, [limit, windowMs])

  useEffect(() => {
    if (!state.blocked) return
    const id = setInterval(recompute, 500)
    return () => clearInterval(id)
  }, [state.blocked, recompute])

  const record = useCallback(() => {
    stamps.current.push(Date.now())
    recompute()
  }, [recompute])

  const check = useCallback(() => {
    const now = Date.now()
    const live = stamps.current.filter((t) => now - t < windowMs)
    return live.length < limit
  }, [limit, windowMs])

  return {...state, record, check, limit}
}
