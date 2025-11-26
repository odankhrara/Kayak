import { useEffect } from 'react'
import { useStore } from '../../store/useStore'
import './StatusBar.css'

export function StatusBar() {
  const { error, statusMessage, setError, setStatusMessage } = useStore()

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [statusMessage, setStatusMessage])

  if (!error && !statusMessage) return null

  return (
    <div className="status-bar">
      {error && (
        <div className="status-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {statusMessage && (
        <div className="status-success">
          <span>✓ {statusMessage}</span>
          <button onClick={() => setStatusMessage(null)}>×</button>
        </div>
      )}
    </div>
  )
}

