// Tipos para las invitaciones
export interface Invitation {
  id: string
  createdAt: Date
  updatedAt: Date
  guestName: string
  guestPhone?: string
  maxGuests: number
  notes?: string
  isActive: boolean
  isRevoked: boolean
  deviceId?: string
  firstAccessAt?: Date
  lastAccessAt?: Date
  accessCount: number
  hasResponded: boolean
  isAttending?: boolean
  guestCount?: number
  message?: string
  respondedAt?: Date
  tokens: InvitationToken[]
}

// Tipos para los tokens de invitación
export interface InvitationToken {
  id: string
  createdAt: Date
  updatedAt: Date
  token: string
  isBurned: boolean
  firstAccessAt?: Date
  lastAccessAt?: Date
  deviceId?: string
  userAgent?: string
  invitationId: string
  invitation: Invitation
}



// Tipos para usuarios administradores
export interface AdminUser {
  id: string
  createdAt: Date
  updatedAt: Date
  username: string
  password: string
}



// Tipos para formularios
export interface CreateInvitationForm {
  guestName: string
  guestPhone?: string
  maxGuests: number
  notes?: string
}

export interface UpdateInvitationForm {
  guestName?: string
  guestPhone?: string
  maxGuests?: number
  notes?: string
  isActive?: boolean
  isRevoked?: boolean
}

export interface InvitationResponseForm {
  isAttending: boolean
  guestCount: number
  message?: string
}

// Tipos para estadísticas
export interface InvitationStats {
  total: number
  active: number
  revoked: number
  responded: number
  attending: number
  notAttending: number
  totalGuests: number
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Tipos para autenticación
export interface LoginForm {
  username: string
  password: string
}

export interface AuthResponse {
  user: Omit<AdminUser, 'password'>
  token: string
}
