import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { checkIsAdmin, getAdminToken, getCachedAdmin } from '../../services/adminApi'

export const AdminRouteGuard = () => {
  const [status, setStatus] = useState(() => {
    if (!getAdminToken()) return 'denied'
    return getCachedAdmin() ? 'allowed' : 'checking'
  })

  useEffect(() => {
    if (status !== 'checking') return
    let mounted = true
    checkIsAdmin().then(allowed => {
      if (mounted) setStatus(allowed ? 'allowed' : 'denied')
    })
    return () => {
      mounted = false
    }
  }, [status])

  if (status === 'allowed') return <Outlet />

  if (status === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-slate-700 font-mono tracking-wider">
            Verifying Faculty Authorization...
          </span>
        </div>
      </div>
    )
  }

  return <Navigate to="/admin/login" replace />
}

export default AdminRouteGuard
