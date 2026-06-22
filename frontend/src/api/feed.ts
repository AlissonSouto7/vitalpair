import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { FeedItem, Page, ReactionType } from '../types/feed'

export async function getFeed(page = 0, size = 20): Promise<Page<FeedItem>> {
  const res = await api.get<ApiResponse<Page<FeedItem>>>('/pair/feed', {
    params: { page, size },
  })
  return res.data.data
}

export async function reactToItem(itemId: string, type: ReactionType): Promise<void> {
  await api.post(`/pair/feed/${itemId}/reactions`, { type })
}

export async function removeReaction(itemId: string, type: ReactionType): Promise<void> {
  await api.delete(`/pair/feed/${itemId}/reactions/${type}`)
}
