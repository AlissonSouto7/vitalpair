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

/** Points by where they came from. The label is written on screen, from `source`. */
export interface SeasonBreakdown {
  source: 'MEAL' | 'ACTIVITY' | 'STREAK' | 'MISSION'
  you: number
  rival: number
}

/**
 * A finished season.
 *
 * The server used to send a ready-made "30 dias · fechou em 14/08", in Portuguese and with a
 * Brazilian date, whatever language the reader had chosen. It sends the facts now.
 */
export interface SeasonHistoryItem {
  number: number
  lengthDays: number
  /** ISO date, formatted on screen in the reader's locale. */
  endedOn: string
  you: number
  rival: number
  winner: SeasonWinner
  stake: string | null
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
