export type SeasonWinner = 'YOU' | 'RIVAL' | 'TIE'

export interface SeasonSide {
  name: string
  score: number
}

export interface SeasonDay {
  label: string
  you: number
  rival: number
}

export interface SeasonBreakdown {
  source: string
  label: string
  you: number
  rival: number
}

export interface SeasonHistoryItem {
  number: number
  sub: string
  you: number
  rival: number
  winner: SeasonWinner
}

export interface SeasonView {
  number: number
  day: number
  total: number
  daysLeft: number
  stake: string
  hasPartner: boolean
  you: SeasonSide
  rival: SeasonSide | null
  days: SeasonDay[]
  breakdown: SeasonBreakdown[]
  history: SeasonHistoryItem[]
}
