import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector(state => state.auth)

  if (!initialized) return (
    <div className="loading-center">
      <div className="loading-spinner" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  return children
}

export default ProtectedRoute
