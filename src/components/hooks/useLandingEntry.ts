import {useEffect, useState} from 'react'

export function useLandingEntry() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // forum does not use the upstream starter-pack landing overlay.
    // Always finish landing initialization without converting the URL into
    // an external branded landing surface.
    setReady(true)
  }, [])

  return ready
}
