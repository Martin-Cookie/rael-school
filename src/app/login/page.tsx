'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locale, setLocale] = useState<'cs' | 'en' | 'sw'>('cs')

  const labels = {
    cs: { title: 'Škola Rael', subtitle: 'Informační systém', email: 'E-mail', password: 'Heslo', login: 'Přihlásit se', error: 'Neplatný e-mail nebo heslo', kenya: 'Keňa' },
    en: { title: 'Rael School', subtitle: 'Information System', email: 'Email', password: 'Password', login: 'Sign in', error: 'Invalid email or password', kenya: 'Kenya' },
    sw: { title: 'Shule ya Rael', subtitle: 'Mfumo wa Habari', email: 'Barua pepe', password: 'Nywila', login: 'Ingia', error: 'Barua pepe au nywila si sahihi', kenya: 'Kenya' },
  }

  const t = labels[locale]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(t.error)
      }
    } catch {
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-accent-400" />
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-accent-300" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-earth-300" />
      </div>

      {/* Language switcher */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <Globe className="w-5 h-5 text-white/70" />
        {(['cs', 'en', 'sw'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              locale === l
                ? 'bg-white text-primary-700'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Login card */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">R</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500 mt-1">{t.subtitle} — {t.kenya} 🇰🇪</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900"
              placeholder="admin@rael.school"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {t.login}
              </>
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-2">Demo přístupy / Demo logins:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Admin:</strong> admin@rael.school / admin123</p>
            <p><strong>Manager:</strong> manager@rael.school / manager123</p>
            <p><strong>Sponsor:</strong> sponsor@example.com / sponsor123</p>
            <p><strong>Volunteer:</strong> volunteer@example.com / volunteer123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
