'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Heart, CreditCard, BarChart3,
  LogOut, Menu, X, Globe, Settings, GraduationCap, Moon, Sun, FileText
} from 'lucide-react'

import { useLocale } from '@/hooks/useLocale'
import { type Locale, localeNames } from '@/lib/i18n'

interface SidebarProps {
  user: { id: string; firstName: string; lastName: string; role: string; email: string }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { locale, t } = useLocale()
  const [showLang, setShowLang] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleDark() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('rael-theme', next ? 'dark' : 'light')
  }

  function changeLocale(l: Locale) {
    localStorage.setItem('rael-locale', l)
    setShowLang(false)
    window.dispatchEvent(new CustomEvent('locale-change', { detail: l }))
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: '/students', icon: Users, label: t('nav.students') },
    { href: '/classes', icon: GraduationCap, label: t('nav.classes') },
    { href: '/sponsors', icon: Heart, label: t('nav.sponsors'), roles: ['ADMIN', 'MANAGER', 'VOLUNTEER'] },
    { href: '/payments', icon: CreditCard, label: t('nav.payments'), roles: ['ADMIN', 'MANAGER'] },
    { href: '/tuition', icon: FileText, label: t('nav.tuition'), roles: ['ADMIN', 'MANAGER'] },
    { href: '/reports', icon: BarChart3, label: t('nav.reports'), roles: ['ADMIN', 'MANAGER', 'VOLUNTEER'] },
    { href: '/admin', icon: Settings, label: t('nav.admin'), roles: ['ADMIN'] },
  ]

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(user.role))

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    SPONSOR: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
    VOLUNTEER: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  }

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <button aria-label="Menu" onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <span className="font-bold text-primary-700 dark:text-primary-400">{t('app.title')}</span>
        <div className="w-10" />
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-200 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">R</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{t('app.title')}</h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{t('app.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Language switcher */}
          <div className="px-2 py-2 border-t border-gray-100 dark:border-gray-700">
            <div className="relative">
              <button
                onClick={() => setShowLang(!showLang)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Globe className="w-3.5 h-3.5" />
                {localeNames[locale]}
              </button>
              {showLang && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                  {(['cs', 'en', 'sw'] as Locale[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => changeLocale(l)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${locale === l ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {localeNames[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dark mode toggle */}
          <div className="px-2 py-1">
            <button
              onClick={toggleDark}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {isDark ? t('app.lightMode') : t('app.darkMode')}
            </button>
          </div>

          {/* User info */}
          <div className="px-2 py-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-200">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColors[user.role] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {t(`roles.${user.role}`)}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
