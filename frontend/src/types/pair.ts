export type PairStatus = 'PENDING' | 'ACTIVE' | 'PAUSED'
export type RelationshipType = 'PAIR' | 'DUO' | 'FRIENDS' | 'CONFIDANTS' | 'BROTHERS' | 'OTHER'

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
  relationshipType: RelationshipType
  inviteCode: string
  members: PairMember[]
}
