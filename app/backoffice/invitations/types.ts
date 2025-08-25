export interface Invitation {
  id: string
  guestName: string
  guestNickname: string | null
  guestPhone: string | null
  maxGuests: number
  hasResponded: boolean
  isAttending: boolean | null
  guestCount: number | null
  respondedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface InvitationToken {
  id: string
  token: string
  isUsed: boolean
  firstAccessAt: Date | null
  lastAccessAt: Date | null
  deviceId: string | null
  userAgent: string | null
  accessCount: number
  createdAt: Date
  updatedAt: Date
}

export interface InvitationWithTokens extends Invitation {
  tokens: InvitationToken[]
}

export interface InvitationsStats {
  total: number
  pending: number
  confirmed: number
  declined: number
}
