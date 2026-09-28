import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { NotificationsBell } from './NotificationsBell'

import i18n from '@/i18n'
import { fail, ok, path, recording } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import type { AppNotification, NotificationFeed } from '@/types/notification'

function notification(over: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'n1',
    type: 'PARTNER_MEAL',
    actorName: 'Célia',
    refText: 'feijoada',
    amount: null,
    read: false,
    createdAt: new Date().toISOString(),
    ...over,
  }
}

function feedOf(unreadCount: number, items: AppNotification[]): NotificationFeed {
  return { unreadCount, items }
}

/** The feed endpoint answering with a given state. */
function feedIs(feed: NotificationFeed) {
  return http.get(path('/notifications'), () => ok(feed))
}

/** The bell button itself, by the title it carries. */
function bell() {
  return screen.getByRole('button', { name: i18n.t('header.notifications') })
}

describe('NotificationsBell', () => {
  it('shows how many are unread', async () => {
    server.use(feedIs(feedOf(3, [notification()])))
    renderWithProviders(<NotificationsBell />)

    expect(await screen.findByText('3')).toBeInTheDocument()
  })

  it('clears the badge as soon as the panel opens', async () => {
    const { handler, calls } = recording('put', '/notifications/read')
    server.use(feedIs(feedOf(2, [notification()])), handler)
    const { user } = renderWithProviders(<NotificationsBell />)

    expect(await screen.findByText('2')).toBeInTheDocument()
    await user.click(bell())

    // Cleared before the request finishes, on purpose: waiting for a round trip to hide a
    // number the person is already looking at reads as lag.
    await waitFor(() => expect(screen.queryByText('2')).not.toBeInTheDocument())
    await waitFor(() => expect(calls).toHaveLength(1))
  })

  it('does not tell the server to mark anything when there is nothing unread', async () => {
    const { handler, calls } = recording('put', '/notifications/read')
    server.use(feedIs(feedOf(0, [notification({ read: true })])), handler)
    const { user } = renderWithProviders(<NotificationsBell />)

    await user.click(bell())
    await screen.findByText(/feijoada/)

    // The bell is in the header of every screen, so a request on every open would be a
    // steady trickle of writes that change nothing.
    expect(calls).toHaveLength(0)
  })

  it('writes each kind of notification in words the product uses', async () => {
    server.use(
      feedIs(
        feedOf(0, [
          notification({ id: 'a', type: 'PARTNER_MEAL', actorName: 'Célia', refText: 'feijoada' }),
          notification({ id: 'b', type: 'RIVAL_OVERTOOK', actorName: 'Célia' }),
          notification({ id: 'c', type: 'FLASH_MISSION' }),
        ]),
      ),
    )
    const { user } = renderWithProviders(<NotificationsBell />)

    await user.click(bell())

    expect(await screen.findByText(/feijoada/)).toBeInTheDocument()
    expect(screen.getByText(i18n.t('notifications.overtookTitle'))).toBeInTheDocument()
    expect(screen.getByText(i18n.t('notifications.flashTitle'))).toBeInTheDocument()
  })

  it('keeps the same accessible name whether or not there is a badge', async () => {
    server.use(feedIs(feedOf(4, [notification()])))
    renderWithProviders(<NotificationsBell />)

    // The badge span is inside the button, so before the fix its text joined the name and
    // the control announced itself as "Notificações 4" one moment and "Notificações" the
    // next. A label that moves as data arrives is a moving target for anyone navigating by
    // name. Found by this test failing to locate the button once the count arrived.
    await screen.findByText('4')
    expect(bell()).toBeInTheDocument()
  })

  it('stays quiet when the feed cannot be loaded', async () => {
    server.use(http.get(path('/notifications'), () => fail(500, 'Erro interno')))
    renderWithProviders(<NotificationsBell />)

    // The bell sits in the header of every screen. A failure here must never put an error
    // banner where the notifications go: the bell simply shows nothing unread.
    expect(bell()).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/erro/i)).not.toBeInTheDocument())
  })
})
