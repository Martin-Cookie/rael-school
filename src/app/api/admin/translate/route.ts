import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

async function translateText(text: string, targetLang: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=cs|${targetLang}`
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    const data = await res.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText
      // MyMemory returns the original text when no translation is found
      if (translated.toLowerCase() === text.toLowerCase()) return null
      return translated
    }
    return null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rl = checkRateLimit(`translate:${user.id}`, 20, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

    const { text } = await request.json()
    if (!text?.trim()) return NextResponse.json({ error: 'Text is required' }, { status: 400 })

    const [enResult, swResult] = await Promise.allSettled([
      translateText(text.trim(), 'en'),
      translateText(text.trim(), 'sw'),
    ])

    const en = enResult.status === 'fulfilled' ? enResult.value : null
    const sw = swResult.status === 'fulfilled' ? swResult.value : null

    // Pokud oba překlady selhaly, vrátit 502
    if (en === null && sw === null && enResult.status === 'rejected' && swResult.status === 'rejected') {
      return NextResponse.json({ error: 'Translation service unavailable' }, { status: 502 })
    }

    return NextResponse.json({ en, sw })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
