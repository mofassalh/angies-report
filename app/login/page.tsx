'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: '#F5C800' }}>
            <span className="text-2xl font-bold text-black">A</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Angie's Reports</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Owner access only</p>
        </div>

        <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid #e5e5e5' }}>
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#fff0f0', color: '#cc0000' }}>
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: '#f9f9f9', border: '1px solid #e5e5e5', color: '#1A1A1A' }}
                placeholder="owner@angies.com.au" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: '#f9f9f9', border: '1px solid #e5e5e5', color: '#1A1A1A' }}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
          </div>
          <button onClick={handleLogin} disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl font-semibold mt-4 transition-all disabled:opacity-50"
            style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </main>
  )
}
