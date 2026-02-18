import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

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

    const { text } = await request.json()
    if (!text?.trim()) return NextResponse.json({ error: 'Text is required' }, { status: 400 })

    const [enResult, swResult] = await Promise.allSettled([
      translateText(text.trim(), 'en'),
      translateText(text.trim(), 'sw'),
    ])

    return NextResponse.json({
      en: enResult.status === 'fulfilled' ? enResult.value : null,
      sw: swResult.status === 'fulfilled' ? swResult.value : null,
    })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ en: null, sw: null })
  }
}
