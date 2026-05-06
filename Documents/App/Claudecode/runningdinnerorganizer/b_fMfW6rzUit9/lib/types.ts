// Running Dinner Organizer - Type Definitions

export interface Organizer {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface Event {
  id: string
  organizerId: string
  name: string
  date: Date
  description: string
  city: string
  centerLocation: { lat: number; lng: number }
  registrationDeadline: Date
  maxParticipants: number
  status: EventStatus
  schedule: EventSchedule
  createdAt: Date
}

export type EventStatus = 
  | 'draft' 
  | 'registration_open' 
  | 'registration_closed' 
  | 'teams_assigned' 
  | 'completed'

export interface EventSchedule {
  appetizer: TimeSlot
  main: TimeSlot
  dessert: TimeSlot
}

export interface TimeSlot {
  start: string // HH:MM format
  end: string   // HH:MM format
}

export interface Participant {
  id: string
  eventId: string
  name: string
  email: string
  phone: string
  address: string
  location: { lat: number; lng: number }
  dietaryRestrictions: DietaryRestriction[]
  notes?: string
  teamId?: string
  hostingCourse?: Course
  registeredAt: Date
}

export type DietaryRestriction = 
  | 'vegetarian' 
  | 'vegan' 
  | 'gluten_free' 
  | 'lactose_free' 
  | 'nut_allergy' 
  | 'shellfish_allergy'
  | 'other'

export type Course = 'appetizer' | 'main' | 'dessert'

export interface Team {
  id: string
  eventId: string
  member1Id: string
  member2Id: string
  hostingCourse: Course
  address: string
  location: { lat: number; lng: number }
}

export interface CourseAssignment {
  id: string
  eventId: string
  course: Course
  hostTeamId: string
  guestTeam1Id: string
  guestTeam2Id: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: EmailTemplateType
}

export type EmailTemplateType = 
  | 'registration_confirmation' 
  | 'team_assignment' 
  | 'reminder' 
  | 'thank_you'

export interface EmailLog {
  id: string
  eventId: string
  templateId: string
  recipientId: string
  recipientEmail: string
  sentAt: Date
  status: 'sent' | 'failed' | 'pending'
}

// Form types for multi-step forms
export interface EventFormData {
  // Step 1: Basic Info
  name: string
  date: Date | null
  description: string
  
  // Step 2: Location
  city: string
  centerAddress: string
  centerLocation: { lat: number; lng: number } | null
  
  // Step 3: Schedule
  schedule: EventSchedule
  
  // Step 4: Options
  registrationDeadline: Date | null
  maxParticipants: number
}

export interface ParticipantFormData {
  // Step 1: Personal Info
  name: string
  email: string
  phone: string
  
  // Step 2: Address
  address: string
  location: { lat: number; lng: number } | null
  
  // Step 3: Preferences
  dietaryRestrictions: DietaryRestriction[]
  notes: string
}

// Algorithm configuration
export interface AlgorithmConfig {
  optimizeDistance: boolean
  respectDietaryRestrictions: boolean
  maxDistanceKm: number
}
