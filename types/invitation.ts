// Core Invitation interface
export interface Invitation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  guestName: string;
  guestNickname: string | null;
  guestPhone: string | null;
  maxGuests: number;
  hasResponded: boolean;
  isAttending: boolean | null;
  guestCount: number | null;
  respondedAt: Date | null;
}

// Invitation Token interface
export interface InvitationToken {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isUsed: boolean;
  firstAccessAt: Date | null;
  lastAccessAt: Date | null;
  deviceId: string | null;
  userAgent: string | null;
  accessCount: number;
  invitationId: string;
}

// Extended interfaces
export interface InvitationWithTokens extends Invitation {
  tokens: InvitationToken[];
}

// Form interfaces
export interface CreateInvitationForm {
  guestName: string;
  guestNickname?: string;
  guestPhone?: string;
  maxGuests: number;
}

export interface UpdateInvitationForm {
  guestName?: string;
  guestNickname?: string;
  guestPhone?: string;
  maxGuests?: number;
  hasResponded?: boolean;
  isAttending?: boolean;
  guestCount?: number;
}

export interface InvitationResponseForm {
  isAttending: boolean;
  guestCount: number;
  message?: string;
}

// Statistics interfaces
export interface InvitationStats {
  total: number;
  pending: number;
  confirmed: number;
  declined: number;
}
