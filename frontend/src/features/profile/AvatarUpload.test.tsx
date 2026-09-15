import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { AvatarUpload } from './AvatarUpload'

import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'

/**
 * What the screen refuses before spending an upload, and what it sends when it accepts.
 *
 * The local checks exist for the person, not for safety: the server re-validates and re-encodes
 * whatever arrives, so none of this is load-bearing against an attacker. What it protects is
 * somebody on a phone connection learning that their 20 MB screenshot will not do before they
 * spend a minute sending it.
 */
describe('AvatarUpload', () => {
  /**
   * jsdom has no createImageBitmap and no real canvas encoder, so the downscale is stubbed.
   * The test is about which files reach the network and which are refused locally, which is
   * decided before any of that runs.
   */
  function stubImagePipeline() {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(() => Promise.resolve({ width: 1600, height: 1200, close: vi.fn() })),
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/jpeg;base64,ZmFrZS1qcGVn',
    )
  }

  function file(name: string, type: string, sizeBytes: number) {
    const f = new File(['x'], name, { type })
    // File size is read-only, and the guard under test is exactly the size check.
    Object.defineProperty(f, 'size', { value: sizeBytes })
    return f
  }

  it('sends the picked photo and reports the new name', async () => {
    stubImagePipeline()
    let sent: unknown = null
    server.use(
      http.put('*/users/me/avatar', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({
          success: true,
          message: 'ok',
          data: { avatarUrl: 'a'.repeat(32) + '.jpg' },
        })
      }),
    )

    const { user } = renderWithProviders(<AvatarUpload name="Alisson" currentAvatar={null} />)
    await user.upload(
      screen.getByLabelText(i18n.t('profile.avatarPickAria')),
      file('face.jpg', 'image/jpeg', 500_000),
    )

    await waitFor(() => expect(sent).not.toBeNull())
    // Plain base64, no data: prefix, which is what the endpoint documents.
    expect(sent).toEqual({ imageBase64: 'ZmFrZS1qcGVn' })
  })

  it('refuses a file that is not an accepted image, without calling the server', async () => {
    stubImagePipeline()
    const calls = vi.fn()
    server.use(
      http.put('*/users/me/avatar', () => {
        calls()
        return HttpResponse.json({ success: true, message: 'ok', data: { avatarUrl: 'x.jpg' } })
      }),
    )

    renderWithProviders(<AvatarUpload name="Alisson" currentAvatar={null} />)
    const input = screen.getByLabelText(i18n.t('profile.avatarPickAria'))

    // Dispatched directly rather than through user.upload, which honours the input's `accept`
    // and silently attaches nothing, so the guard under test would never run. A real browser
    // honours it too from the picker, but `accept` is a filter on a dialog and not a
    // restriction: a file can still arrive by drag and drop, and the attribute can be edited
    // away in devtools. The guard is what makes the refusal real, so it has to be exercised
    // with a file that actually reached the handler.
    Object.defineProperty(input, 'files', {
      value: [file('resume.pdf', 'application/pdf', 1000)],
      configurable: true,
    })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('profile.avatarFormat'))
    expect(calls).not.toHaveBeenCalled()
  })

  it('refuses a file over the size ceiling, without calling the server', async () => {
    stubImagePipeline()
    const calls = vi.fn()
    server.use(
      http.put('*/users/me/avatar', () => {
        calls()
        return HttpResponse.json({ success: true, message: 'ok', data: { avatarUrl: 'x.jpg' } })
      }),
    )

    const { user } = renderWithProviders(<AvatarUpload name="Alisson" currentAvatar={null} />)
    await user.upload(
      screen.getByLabelText(i18n.t('profile.avatarPickAria')),
      file('huge.jpg', 'image/jpeg', 9 * 1024 * 1024),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('profile.avatarTooBig'))
    expect(calls).not.toHaveBeenCalled()
  })

  it("shows the server's reason when it refuses the image", async () => {
    stubImagePipeline()
    server.use(
      http.put('*/users/me/avatar', () =>
        HttpResponse.json(
          {
            success: false,
            message: 'Formato não aceito. Envie um JPEG, PNG ou WebP.',
            data: null,
          },
          { status: 422 },
        ),
      ),
    )

    const { user } = renderWithProviders(<AvatarUpload name="Alisson" currentAvatar={null} />)
    await user.upload(
      screen.getByLabelText(i18n.t('profile.avatarPickAria')),
      file('polyglot.jpg', 'image/jpeg', 2000),
    )

    // The server's own words, not a generic message: it is the only side that knows which
    // defence the file hit.
    expect(await screen.findByRole('alert')).toHaveTextContent('Formato não aceito')
  })

  it('offers removal only once there is a photo', () => {
    const withoutPhoto = renderWithProviders(<AvatarUpload name="Alisson" currentAvatar={null} />)
    expect(screen.queryByText(i18n.t('profile.avatarRemove'))).not.toBeInTheDocument()
    withoutPhoto.unmount()

    renderWithProviders(<AvatarUpload name="Alisson" currentAvatar={'b'.repeat(32) + '.jpg'} />)
    expect(screen.getByText(i18n.t('profile.avatarRemove'))).toBeInTheDocument()
  })

  it('renders the stored photo through the avatar endpoint, not as a raw name', () => {
    renderWithProviders(<AvatarUpload name="Alisson" currentAvatar={'c'.repeat(32) + '.jpg'} />)

    const img = document.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toContain('/users/avatars/' + 'c'.repeat(32) + '.jpg')
  })
})
