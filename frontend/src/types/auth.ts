export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  userId: string
}

export interface RegisterPayload {
  email: string
  password: string
  name: string
}

export interface LoginPayload {
  email: string
  password: string
}
