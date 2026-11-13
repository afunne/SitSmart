// TypeScript types for the API DTOs. ASP.NET serializes properties in camelCase and
// DateTime values as ISO 8601 strings (UTC values end in "Z"), so dates are typed as string.
//
// LoginResponse and MeResponse match Piletimyyk.Api/Dtos. The other DTOs don't exist in the
// backend yet; they are based on the EF models in Piletimyyk.Api/Models and must be kept in
// sync once the endpoints are written.

export type Role = 'Admin' | 'Buyer' | 'Controller' | 'Service'

/** ISO 8601 date-time string, e.g. "2026-12-14T17:00:00Z". */
export type IsoDateTime = string

// ---- Auth (Dtos/LoginRequest.cs, LoginResponse.cs, MeResponse.cs) ----

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  email: string
  role: Role
  expiresAt: IsoDateTime
}

export interface MeResponse {
  email: string | null
  role: Role | null
}

// ---- Events and halls (provisional) ----

export interface HallDto {
  id: number
  name: string
  seatCount: number
}

export interface EventDto {
  id: number
  name: string
  description: string | null
  startTime: IsoDateTime
  price: number
  hallId: number
  hallName: string
}

// ---- Seats (provisional) ----

/** 'Mine' = reserved or bought by the current user. */
export type SeatState = 'Free' | 'Reserved' | 'Sold' | 'Mine'

export interface SeatDto {
  id: number
  row: number
  number: number
  state: SeatState
}

// ---- Reservations and tickets (provisional) ----

export interface ReservationDto {
  id: number
  eventId: number
  seatId: number
  row: number
  number: number
  createdAt: IsoDateTime
  expiresAt: IsoDateTime
}

export interface TicketDto {
  id: number
  code: string
  eventId: number
  eventName: string
  startTime: IsoDateTime
  hallName: string
  seatId: number
  row: number
  number: number
  purchasedAt: IsoDateTime
  usedAt: IsoDateTime | null
}

// ---- Admin statistics (provisional) ----

export interface EventStatsDto {
  eventId: number
  eventName: string
  totalSeats: number
  soldSeats: number
  reservedSeats: number
  freeSeats: number
  revenue: number
}
