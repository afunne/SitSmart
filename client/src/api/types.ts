// TypeScript types for the API DTOs. ASP.NET serializes properties in camelCase and
// DateTime values as ISO 8601 strings (UTC values end in "Z"), so dates are typed as string.
//
// Auth, halls, events, seats, reservations and tickets match Piletimyyk.Api/Dtos. Statistics
// don't exist in the backend yet; they are based on the EF models in Piletimyyk.Api/Models
// and must be kept in sync once that endpoint is written.

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

// ---- Halls (Dtos/HallDto.cs, CreateHallRequest.cs, UpdateHallRequest.cs) ----

export interface HallDto {
  id: number
  name: string
  rows: number
  seatsPerRow: number
  seatCount: number
}

/** Name: 1–100 characters. Rows and seatsPerRow: 1–50. */
export interface CreateHallRequest {
  name: string
  rows: number
  seatsPerRow: number
}

/** Only the name can change; the seat layout is fixed when the hall is created. */
export interface UpdateHallRequest {
  name: string
}

// ---- Events (Dtos/EventDto.cs, CreateEventRequest.cs, UpdateEventRequest.cs) ----

export interface EventDto {
  id: number
  name: string
  description: string
  imageUrl: string | null
  startsAt: IsoDateTime
  hallId: number
  hallName: string
  price: number
  totalSeats: number
}

/** startsAt must be in UTC (e.g. new Date(local).toISOString()) and in the future. */
export interface CreateEventRequest {
  name: string
  description: string
  imageUrl: string | null
  startsAt: IsoDateTime
  hallId: number
  price: number
}

export type UpdateEventRequest = CreateEventRequest

// ---- Seats (Dtos/SeatMapDto.cs, SeatDto.cs, SeatStates.cs) ----

/** 'Mine' = held by an active reservation of the current user. */
export type SeatState = 'Free' | 'Reserved' | 'Sold' | 'Mine'

export interface SeatDto {
  seatId: number
  row: number
  number: number
  state: SeatState
}

/** Seats are ordered by row, then number. */
export interface SeatMapDto {
  eventId: number
  hallName: string
  rows: number
  seatsPerRow: number
  seats: SeatDto[]
}

// ---- Reservations (Dtos/ReservationDto.cs, CreateReservationRequest.cs) ----

export interface CreateReservationRequest {
  seatId: number
}

export interface ReservationDto {
  id: number
  eventId: number
  seatId: number
  row: number
  number: number
  expiresAt: IsoDateTime
}

// ---- Tickets (Dtos/TicketDto.cs) ----

/** Returned by POST /api/reservations/{id}/purchase and GET /api/tickets/my. usedAt: null until scanned. */
export interface TicketDto {
  id: number
  code: string
  eventName: string
  startsAt: IsoDateTime
  hallName: string
  row: number
  number: number
  price: number
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
