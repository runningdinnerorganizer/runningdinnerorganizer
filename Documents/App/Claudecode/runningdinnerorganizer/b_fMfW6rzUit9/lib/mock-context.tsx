'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type {
  Organizer,
  Event,
  Participant,
  Team,
  CourseAssignment,
  EmailTemplate,
  EmailLog,
} from './types'
import {
  mockOrganizer,
  mockEvents,
  mockParticipants,
  mockTeams,
  mockAssignments,
  mockEmailTemplates,
} from './mock-initial-data'

interface MockDataContextType {
  // Auth
  currentUser: Organizer | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  
  // Events
  events: Event[]
  getEvent: (id: string) => Event | undefined
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'organizerId'>) => Event
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void
  
  // Participants
  participants: Participant[]
  getEventParticipants: (eventId: string) => Participant[]
  getParticipant: (id: string) => Participant | undefined
  addParticipant: (participant: Omit<Participant, 'id' | 'registeredAt'>) => Participant
  updateParticipant: (id: string, updates: Partial<Participant>) => void
  deleteParticipant: (id: string) => void
  
  // Teams
  teams: Team[]
  getEventTeams: (eventId: string) => Team[]
  createTeams: (eventId: string, teams: Omit<Team, 'id'>[]) => Team[]
  updateTeam: (id: string, updates: Partial<Team>) => void
  clearEventTeams: (eventId: string) => void
  
  // Assignments
  assignments: CourseAssignment[]
  getEventAssignments: (eventId: string) => CourseAssignment[]
  createAssignments: (eventId: string, assignments: Omit<CourseAssignment, 'id'>[]) => CourseAssignment[]
  clearEventAssignments: (eventId: string) => void
  
  // Email Templates
  emailTemplates: EmailTemplate[]
  getTemplate: (id: string) => EmailTemplate | undefined
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => void
  
  // Email Logs
  emailLogs: EmailLog[]
  logEmail: (log: Omit<EmailLog, 'id'>) => void
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined)

const STORAGE_KEY = 'running-dinner-data'

interface StoredData {
  currentUser: Organizer | null
  events: Event[]
  participants: Participant[]
  teams: Team[]
  assignments: CourseAssignment[]
  emailTemplates: EmailTemplate[]
  emailLogs: EmailLog[]
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentUser, setCurrentUser] = useState<Organizer | null>(null)
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants)
  const [teams, setTeams] = useState<Team[]>(mockTeams)
  const [assignments, setAssignments] = useState<CourseAssignment[]>(mockAssignments)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(mockEmailTemplates)
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data: StoredData = JSON.parse(stored, (key, value) => {
          // Convert date strings back to Date objects
          if (key === 'date' || key === 'registrationDeadline' || key === 'registeredAt' || key === 'createdAt' || key === 'sentAt') {
            return new Date(value)
          }
          return value
        })
        setCurrentUser(data.currentUser)
        setEvents(data.events)
        setParticipants(data.participants)
        setTeams(data.teams)
        setAssignments(data.assignments)
        setEmailTemplates(data.emailTemplates)
        setEmailLogs(data.emailLogs)
      } catch (e) {
        console.error('Failed to parse stored data', e)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return
    const data: StoredData = {
      currentUser,
      events,
      participants,
      teams,
      assignments,
      emailTemplates,
      emailLogs,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [isHydrated, currentUser, events, participants, teams, assignments, emailTemplates, emailLogs])

  // Auth functions
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Mock authentication - accept demo credentials or create new user
    if (email === mockOrganizer.email || email) {
      const user: Organizer = email === mockOrganizer.email 
        ? mockOrganizer 
        : { id: generateId('org'), email, name: email.split('@')[0], createdAt: new Date() }
      setCurrentUser(user)
      return true
    }
    return false
  }, [])

  const register = useCallback(async (name: string, email: string, _password: string): Promise<boolean> => {
    const user: Organizer = {
      id: generateId('org'),
      email,
      name,
      createdAt: new Date(),
    }
    setCurrentUser(user)
    return true
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  // Event functions
  const getEvent = useCallback((id: string) => events.find(e => e.id === id), [events])
  
  const createEvent = useCallback((eventData: Omit<Event, 'id' | 'createdAt' | 'organizerId'>): Event => {
    const newEvent: Event = {
      ...eventData,
      id: generateId('evt'),
      organizerId: currentUser?.id || 'unknown',
      createdAt: new Date(),
    }
    setEvents(prev => [...prev, newEvent])
    return newEvent
  }, [currentUser])

  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setParticipants(prev => prev.filter(p => p.eventId !== id))
    setTeams(prev => prev.filter(t => t.eventId !== id))
    setAssignments(prev => prev.filter(a => a.eventId !== id))
  }, [])

  // Participant functions
  const getEventParticipants = useCallback((eventId: string) => 
    participants.filter(p => p.eventId === eventId), [participants])
  
  const getParticipant = useCallback((id: string) => 
    participants.find(p => p.id === id), [participants])

  const addParticipant = useCallback((data: Omit<Participant, 'id' | 'registeredAt'>): Participant => {
    const newParticipant: Participant = {
      ...data,
      id: generateId('p'),
      registeredAt: new Date(),
    }
    setParticipants(prev => [...prev, newParticipant])
    return newParticipant
  }, [])

  const updateParticipant = useCallback((id: string, updates: Partial<Participant>) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const deleteParticipant = useCallback((id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id))
  }, [])

  // Team functions
  const getEventTeams = useCallback((eventId: string) => 
    teams.filter(t => t.eventId === eventId), [teams])

  const createTeams = useCallback((eventId: string, newTeams: Omit<Team, 'id'>[]): Team[] => {
    const teamsWithIds = newTeams.map(t => ({
      ...t,
      id: generateId('team'),
    }))
    setTeams(prev => [...prev.filter(t => t.eventId !== eventId), ...teamsWithIds])
    return teamsWithIds
  }, [])

  const updateTeam = useCallback((id: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const clearEventTeams = useCallback((eventId: string) => {
    setTeams(prev => prev.filter(t => t.eventId !== eventId))
    // Also clear assignments and participant team references
    setAssignments(prev => prev.filter(a => a.eventId !== eventId))
    setParticipants(prev => prev.map(p => 
      p.eventId === eventId ? { ...p, teamId: undefined, hostingCourse: undefined } : p
    ))
  }, [])

  // Assignment functions
  const getEventAssignments = useCallback((eventId: string) => 
    assignments.filter(a => a.eventId === eventId), [assignments])

  const createAssignments = useCallback((eventId: string, newAssignments: Omit<CourseAssignment, 'id'>[]): CourseAssignment[] => {
    const assignmentsWithIds = newAssignments.map(a => ({
      ...a,
      id: generateId('assign'),
    }))
    setAssignments(prev => [...prev.filter(a => a.eventId !== eventId), ...assignmentsWithIds])
    return assignmentsWithIds
  }, [])

  const clearEventAssignments = useCallback((eventId: string) => {
    setAssignments(prev => prev.filter(a => a.eventId !== eventId))
  }, [])

  // Email template functions
  const getTemplate = useCallback((id: string) => 
    emailTemplates.find(t => t.id === id), [emailTemplates])

  const updateTemplate = useCallback((id: string, updates: Partial<EmailTemplate>) => {
    setEmailTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  // Email log functions
  const logEmail = useCallback((log: Omit<EmailLog, 'id'>) => {
    const newLog: EmailLog = {
      ...log,
      id: generateId('log'),
    }
    setEmailLogs(prev => [...prev, newLog])
  }, [])

  const value: MockDataContextType = {
    currentUser,
    login,
    register,
    logout,
    events,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    participants,
    getEventParticipants,
    getParticipant,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    teams,
    getEventTeams,
    createTeams,
    updateTeam,
    clearEventTeams,
    assignments,
    getEventAssignments,
    createAssignments,
    clearEventAssignments,
    emailTemplates,
    getTemplate,
    updateTemplate,
    emailLogs,
    logEmail,
  }

  if (!isHydrated) {
    return null // Prevent hydration mismatch
  }

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  )
}

export function useMockData() {
  const context = useContext(MockDataContext)
  if (!context) {
    throw new Error('useMockData must be used within a MockDataProvider')
  }
  return context
}
