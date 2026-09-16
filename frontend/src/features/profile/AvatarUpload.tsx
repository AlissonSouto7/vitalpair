import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { profileQueries } from './queries'

import { removeAvatar, setAvatar } from '@/api/profile'
import { Avatar } from '@/components/ui/Avatar'
import { avatarUrl } from '@/shared/api/avatarUrl'
import { getApiErrorMessage } from '@/shared/api/errors'

/** The ceiling the server enforces. Checked here too, so the refusal is instant and local. */
const MAX_BYTES = 4 * 1024 * 1024

/** What the server will decode. The file picker also filters on it, but a picker can be bypassed. */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

/**
 * The side the picture is reduced to before it is sent.
 *
 * Larger than the 512 the server stores, so the server still has pixels to work with after its
 * own crop, and small enough that a 12 megapixel phone photo stops being a 4 MB upload on a
 * mobile connection.
 */
const UPLOAD_SIZE = 1024

/**
 * Reduces a picked file in the browser and returns it as base64.
 *
 * Done through a canvas, which means the bytes that leave the browser are already re-encoded
 * and carry no EXIF. That is a courtesy, not a defence: the server re-encodes regardless,
 * because anything done here can be skipped by talking to the API directly. What it does buy is
 * a much smaller upload and a faster answer.
 */
async function toUploadableBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, UPLOAD_SIZE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas unavailable')
    context.drawImage(bitmap, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    return dataUrl.slice(dataUrl.indexOf(',') + 1)
  } finally {
    bitmap.close()
  }
}

/**
 * Picking, previewing and removing the profile photo.
 *
 * The preview is the file the person chose, shown immediately, while the upload is still in
 * flight: waiting for a round trip to show a picture they already have on their phone reads as
 * the app being broken. If the upload fails the preview is dropped and the old photo returns.
 */
export function AvatarUpload({
  name,
  currentAvatar,
}: {
  name: string
  currentAvatar: string | null
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useMutation({
    mutationFn: setAvatar,
    onSuccess: async () => {
      setPreview(null)
      await queryClient.invalidateQueries({ queryKey: profileQueries.profile().queryKey })
      // The face appears next to the partner's too, and on the sidebar, which read their own
      // queries. Without this the new photo shows on this screen and nowhere else until a
      // reload.
      await queryClient.invalidateQueries({ queryKey: ['pair'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => {
      setPreview(null)
      setError(getApiErrorMessage(err, t('profile.avatarError')))
    },
  })

  const remove = useMutation({
    mutationFn: removeAvatar,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueries.profile().queryKey })
      await queryClient.invalidateQueries({ queryKey: ['pair'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => setError(getApiErrorMessage(err, t('profile.avatarError'))),
  })

  async function pick(file: File | undefined) {
    setError(null)
    if (!file) return
    // Both checks are also on the server. They are here because a person who picked a 20 MB
    // screenshot should learn that before spending a minute uploading it.
    if (!ACCEPTED.includes(file.type)) {
      setError(t('profile.avatarFormat'))
      return
    }
    if (file.size > MAX_BYTES) {
      setError(t('profile.avatarTooBig'))
      return
    }
    try {
      const base64 = await toUploadableBase64(file)
      setPreview(`data:image/jpeg;base64,${base64}`)
      upload.mutate(base64)
    } catch {
      // A file the browser itself cannot decode: a renamed document, or an image in a format
      // this browser does not support.
      setError(t('profile.avatarUnreadable'))
    }
  }

  const busy = upload.isPending || remove.isPending
  const shown = preview ?? avatarUrl(currentAvatar)

  return (
    <div className="flex items-center gap-4">
      <Avatar
        initial={name.trim().charAt(0).toUpperCase() || '?'}
        tone="you"
        size={72}
        art={shown}
      />

      <div className="min-w-0 flex-1">
        {/*
          The input is hidden because the native file control cannot be styled, and the button
          beside it is what people click. Hidden is not the same as unlabelled, though: without
          a name a screen reader announces an unnamed file field, and anything driving the page
          by accessible name cannot find it at all.
        */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          aria-label={t('profile.avatarPickAria')}
          className="hidden"
          onChange={(e) => {
            void pick(e.target.files?.[0])
            // Cleared so picking the same file twice fires change again, which is what happens
            // when someone retries after a failure.
            e.target.value = ''
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-extrabold text-on-fill transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {upload.isPending
              ? t('profile.avatarUploading')
              : currentAvatar
                ? t('profile.avatarChange')
                : t('profile.avatarAdd')}
          </button>
          {currentAvatar && (
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={busy}
              className="rounded-xl border border-hair px-4 py-2 text-sm font-bold text-muted transition hover:text-ink disabled:opacity-60"
            >
              {t('profile.avatarRemove')}
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs font-semibold text-muted">{t('profile.avatarHint')}</p>
        {error && (
          <p role="alert" className="mt-1.5 text-xs font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
