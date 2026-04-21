'use client'

import { useCallback, useRef, useState, type ReactElement } from 'react'
import { ConfirmDialog, type ConfirmVariant } from '@/components/ConfirmDialog'
import { useLocale } from '@/hooks/useLocale'

interface ConfirmOptions {
  title?: string
  message: string
  details?: string
  variant?: ConfirmVariant
  confirmLabel?: string
  cancelLabel?: string
}

/**
 * Hook pro stylizovaný confirm dialog s Promise API.
 *
 * Použití:
 *   const { confirm, dialog } = useConfirmDialog()
 *   // v JSX někde jednou:  {dialog}
 *   if (!(await confirm({ message: 'Smazat platbu?', variant: 'danger' }))) return
 */
export function useConfirmDialog() {
  const { t } = useLocale()
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)
  const resolveRef = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({ ...opts, resolve })
    })
  }, [])

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setState(null)
  }, [])

  const dialog: ReactElement = (
    <ConfirmDialog
      open={state !== null}
      title={state?.title ?? t('app.confirm')}
      message={state?.message ?? ''}
      details={state?.details}
      variant={state?.variant ?? 'info'}
      confirmLabel={state?.confirmLabel ?? t('app.confirm')}
      cancelLabel={state?.cancelLabel ?? t('app.cancel')}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  )

  return { confirm, dialog }
}
