import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PremiumCallout } from '../premium/PremiumCallout'
import { premiumQueries } from '../premium/queries'

import { CameraIcon, PlusIcon } from './icons'

import { analyzePhoto } from '@/api/nutrition'
import { getApiErrorMessage } from '@/shared/api/errors'
import type { DetectedFood } from '@/types/nutrition'

const round = (v: number) => Math.round(v * 10) / 10

function fileToImage(file: File): Promise<{ base64: string; mediaType: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const comma = result.indexOf(',')
      resolve({
        base64: result.slice(comma + 1),
        mediaType: file.type || 'image/jpeg',
        dataUrl: result,
      })
    }
    // Never shown: the caller catches this and displays the translated message. The text is
    // for whoever reads a stack trace, so it is English like the rest of the code and says
    // which of the two failures happened.
    reader.onerror = () => reject(new Error('FileReader could not read the selected image'))
    reader.readAsDataURL(file)
  })
}

/**
 * Photographing a plate and letting the AI estimate what is on it.
 *
 * Owns its own state rather than taking it from the page: the preview, the encoded image
 * and the detected list mean nothing to the other two tabs, and keeping them here is what
 * lets the page stop carrying six pieces of state it never reads.
 */
export function PhotoTab({ onPick }: { onPick: (food: DetectedFood) => void }) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [image, setImage] = useState<{ base64: string; mediaType: string } | null>(null)
  const [detected, setDetected] = useState<DetectedFood[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = useMutation({
    mutationFn: ({ base64, mediaType }: { base64: string; mediaType: string }) =>
      analyzePhoto(base64, mediaType),
  })

  // The photo is the paid feature itself, so the whole tab is the notice when it is closed.
  // Read only once this tab is opened: the other two tabs owe nothing to the plan.
  const entitlement = useQuery(premiumQueries.entitlement())
  const locked = entitlement.data ? !entitlement.data.aiAccess : false

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    setError(null)
    setDetected(null)
    try {
      const img = await fileToImage(file)
      setPreview(img.dataUrl)
      setImage({ base64: img.base64, mediaType: img.mediaType })
    } catch {
      setError(t('nutrition.photoOpenError'))
    }
  }

  function reset() {
    setPreview(null)
    setImage(null)
    setDetected(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function run() {
    if (!image) return
    setError(null)
    setDetected(null)
    try {
      const res = await analyze.mutateAsync(image)
      setDetected(res.items)
      if (res.items.length === 0) {
        setError(t('nutrition.photoNoFood'))
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('nutrition.photoAiError')))
    }
  }

  if (locked) return <PremiumCallout />

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void pickPhoto(e.target.files?.[0])}
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-hair bg-canvas px-6 py-10 text-center transition hover:border-brand"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <CameraIcon big />
          </span>
          <span className="font-display text-base font-semibold text-ink">
            {t('nutrition.photoDropTitle')}
          </span>
          <span className="text-sm font-semibold text-muted">
            {t('nutrition.photoDropSubtitle')}
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-hair">
            <img
              src={preview}
              alt={t('nutrition.photoAlt')}
              className="max-h-64 w-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={analyze.isPending}
              className="btn-primary flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {analyze.isPending
                ? t('nutrition.analyzing')
                : detected
                  ? t('nutrition.analyzeAgain')
                  : t('nutrition.analyze')}
            </button>
            <button type="button" onClick={reset} className="btn-ghost">
              {t('nutrition.changePhoto')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
        >
          {error}
        </p>
      )}

      {detected && detected.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-extrabold text-ink">{t('nutrition.detectedTitle')}</p>
          <ul className="space-y-2">
            {detected.map((d, i) => (
              <li
                key={`${d.foodName}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-hair bg-surface px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{d.foodName}</p>
                  <p className="text-[11.5px] font-semibold text-muted">
                    ~{round(d.quantityG)}g · {round(d.caloriesKcal)} kcal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onPick(d)}
                  aria-label={t('nutrition.detectedCheckAdd', { name: d.foodName })}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition hover:brightness-105"
                >
                  <PlusIcon />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[11.5px] font-semibold text-muted">{t('nutrition.detectedHint')}</p>
        </div>
      )}
    </div>
  )
}
