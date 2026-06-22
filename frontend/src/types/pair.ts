export type PairStatus = 'PENDING' | 'ACTIVE' | 'PAUSED'

export interface PairMember {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface Pair {
  id: string
  pairName: string | null
  status: PairStatus
  inviteCode: string
  members: PairMember[]
}
