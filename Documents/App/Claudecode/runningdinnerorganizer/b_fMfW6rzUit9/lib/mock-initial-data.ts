// Initial mock data for demo purposes
import type { 
  Organizer, 
  Event, 
  Participant, 
  Team, 
  CourseAssignment,
  EmailTemplate 
} from './types'

export const mockOrganizer: Organizer = {
  id: 'org-1',
  email: 'demo@runningdinner.com',
  name: 'Demo Organizer',
  createdAt: new Date('2024-01-01'),
}

export const mockEvents: Event[] = [
  {
    id: 'evt-1',
    organizerId: 'org-1',
    name: 'Amsterdam Spring Dinner 2024',
    date: new Date('2024-05-15'),
    description: 'Join us for a wonderful evening of food, fun, and new connections! Experience three delicious courses at three different homes across Amsterdam.',
    city: 'Amsterdam',
    centerLocation: { lat: 52.3676, lng: 4.9041 },
    registrationDeadline: new Date('2024-05-10'),
    maxParticipants: 30,
    status: 'teams_assigned',
    schedule: {
      appetizer: { start: '18:00', end: '19:15' },
      main: { start: '19:30', end: '21:00' },
      dessert: { start: '21:15', end: '22:30' },
    },
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'evt-2',
    organizerId: 'org-1',
    name: 'Rotterdam Summer Feast',
    date: new Date('2024-07-20'),
    description: 'A summer running dinner through the streets of Rotterdam. Meet new people and enjoy great food!',
    city: 'Rotterdam',
    centerLocation: { lat: 51.9244, lng: 4.4777 },
    registrationDeadline: new Date('2024-07-15'),
    maxParticipants: 24,
    status: 'registration_open',
    schedule: {
      appetizer: { start: '18:30', end: '19:45' },
      main: { start: '20:00', end: '21:30' },
      dessert: { start: '21:45', end: '23:00' },
    },
    createdAt: new Date('2024-04-15'),
  },
  {
    id: 'evt-3',
    organizerId: 'org-1',
    name: 'Utrecht Autumn Dinner',
    date: new Date('2024-10-12'),
    description: 'Celebrate the autumn season with a cozy running dinner in Utrecht.',
    city: 'Utrecht',
    centerLocation: { lat: 52.0907, lng: 5.1214 },
    registrationDeadline: new Date('2024-10-07'),
    maxParticipants: 18,
    status: 'draft',
    schedule: {
      appetizer: { start: '17:30', end: '18:45' },
      main: { start: '19:00', end: '20:30' },
      dessert: { start: '20:45', end: '22:00' },
    },
    createdAt: new Date('2024-06-01'),
  },
]

export const mockParticipants: Participant[] = [
  // Participants for evt-1 (Amsterdam)
  {
    id: 'p-1',
    eventId: 'evt-1',
    name: 'Emma van Berg',
    email: 'emma@example.com',
    phone: '+31 6 12345678',
    address: 'Prinsengracht 123, Amsterdam',
    location: { lat: 52.3728, lng: 4.8832 },
    dietaryRestrictions: [],
    teamId: 'team-1',
    hostingCourse: 'appetizer',
    registeredAt: new Date('2024-03-15'),
  },
  {
    id: 'p-2',
    eventId: 'evt-1',
    name: 'Lucas de Vries',
    email: 'lucas@example.com',
    phone: '+31 6 23456789',
    address: 'Keizersgracht 456, Amsterdam',
    location: { lat: 52.3702, lng: 4.8871 },
    dietaryRestrictions: ['vegetarian'],
    teamId: 'team-1',
    hostingCourse: 'appetizer',
    registeredAt: new Date('2024-03-16'),
  },
  {
    id: 'p-3',
    eventId: 'evt-1',
    name: 'Sophie Jansen',
    email: 'sophie@example.com',
    phone: '+31 6 34567890',
    address: 'Herengracht 789, Amsterdam',
    location: { lat: 52.3657, lng: 4.8913 },
    dietaryRestrictions: ['gluten_free'],
    teamId: 'team-2',
    hostingCourse: 'main',
    registeredAt: new Date('2024-03-17'),
  },
  {
    id: 'p-4',
    eventId: 'evt-1',
    name: 'Thomas Bakker',
    email: 'thomas@example.com',
    phone: '+31 6 45678901',
    address: 'Singel 234, Amsterdam',
    location: { lat: 52.3745, lng: 4.8894 },
    dietaryRestrictions: [],
    teamId: 'team-2',
    hostingCourse: 'main',
    registeredAt: new Date('2024-03-18'),
  },
  {
    id: 'p-5',
    eventId: 'evt-1',
    name: 'Anna Visser',
    email: 'anna@example.com',
    phone: '+31 6 56789012',
    address: 'Reguliersgracht 567, Amsterdam',
    location: { lat: 52.3633, lng: 4.8956 },
    dietaryRestrictions: ['vegan'],
    teamId: 'team-3',
    hostingCourse: 'dessert',
    registeredAt: new Date('2024-03-19'),
  },
  {
    id: 'p-6',
    eventId: 'evt-1',
    name: 'Daan Mulder',
    email: 'daan@example.com',
    phone: '+31 6 67890123',
    address: 'Amstel 890, Amsterdam',
    location: { lat: 52.3612, lng: 4.9012 },
    dietaryRestrictions: [],
    teamId: 'team-3',
    hostingCourse: 'dessert',
    registeredAt: new Date('2024-03-20'),
  },
  // More participants for Rotterdam event
  {
    id: 'p-7',
    eventId: 'evt-2',
    name: 'Lisa Smit',
    email: 'lisa@example.com',
    phone: '+31 6 78901234',
    address: 'Witte de Withstraat 12, Rotterdam',
    location: { lat: 51.9173, lng: 4.4756 },
    dietaryRestrictions: ['lactose_free'],
    registeredAt: new Date('2024-05-01'),
  },
  {
    id: 'p-8',
    eventId: 'evt-2',
    name: 'Mark Peters',
    email: 'mark@example.com',
    phone: '+31 6 89012345',
    address: 'Nieuwe Binnenweg 45, Rotterdam',
    location: { lat: 51.9189, lng: 4.4678 },
    dietaryRestrictions: [],
    registeredAt: new Date('2024-05-02'),
  },
]

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    eventId: 'evt-1',
    member1Id: 'p-1',
    member2Id: 'p-2',
    hostingCourse: 'appetizer',
    address: 'Prinsengracht 123, Amsterdam',
    location: { lat: 52.3728, lng: 4.8832 },
  },
  {
    id: 'team-2',
    eventId: 'evt-1',
    member1Id: 'p-3',
    member2Id: 'p-4',
    hostingCourse: 'main',
    address: 'Herengracht 789, Amsterdam',
    location: { lat: 52.3657, lng: 4.8913 },
  },
  {
    id: 'team-3',
    eventId: 'evt-1',
    member1Id: 'p-5',
    member2Id: 'p-6',
    hostingCourse: 'dessert',
    address: 'Reguliersgracht 567, Amsterdam',
    location: { lat: 52.3633, lng: 4.8956 },
  },
]

export const mockAssignments: CourseAssignment[] = [
  {
    id: 'assign-1',
    eventId: 'evt-1',
    course: 'appetizer',
    hostTeamId: 'team-1',
    guestTeam1Id: 'team-2',
    guestTeam2Id: 'team-3',
  },
  {
    id: 'assign-2',
    eventId: 'evt-1',
    course: 'main',
    hostTeamId: 'team-2',
    guestTeam1Id: 'team-1',
    guestTeam2Id: 'team-3',
  },
  {
    id: 'assign-3',
    eventId: 'evt-1',
    course: 'dessert',
    hostTeamId: 'team-3',
    guestTeam1Id: 'team-1',
    guestTeam2Id: 'team-2',
  },
]

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Registration Confirmation',
    subject: 'Welcome to {{event_name}}!',
    body: `Dear {{participant_name}},

Thank you for registering for {{event_name}}!

We are excited to have you join us on {{event_date}}. You will receive your team assignment and schedule closer to the event date.

Event Details:
- Date: {{event_date}}
- City: {{event_city}}

If you have any questions, please don't hesitate to reach out.

Best regards,
The Running Dinner Team`,
    type: 'registration_confirmation',
  },
  {
    id: 'tpl-2',
    name: 'Team Assignment',
    subject: 'Your Team Assignment for {{event_name}}',
    body: `Dear {{participant_name}},

Great news! The teams for {{event_name}} have been assigned. Here are your details:

YOUR TEAM
Partner: {{team_partner_name}}
You are hosting: {{hosting_course}} ({{hosting_time}})

YOUR SCHEDULE FOR THE EVENING

Appetizer ({{appetizer_time}}):
Address: {{appetizer_address}}
Hosts: {{appetizer_hosts}}

Main Course ({{main_time}}):
Address: {{main_address}}
Hosts: {{main_hosts}}

Dessert ({{dessert_time}}):
Address: {{dessert_address}}
Hosts: {{dessert_hosts}}

Remember to prepare enough food for 6 people for the course you are hosting!

We look forward to a wonderful evening!

Best regards,
The Running Dinner Team`,
    type: 'team_assignment',
  },
  {
    id: 'tpl-3',
    name: 'Event Reminder',
    subject: 'Reminder: {{event_name}} is Tomorrow!',
    body: `Dear {{participant_name}},

This is a friendly reminder that {{event_name}} is happening tomorrow!

Please make sure you:
- Have prepared your {{hosting_course}} course for 6 people
- Know the addresses you need to visit
- Have your phone charged for navigation

Your schedule:
- Appetizer: {{appetizer_address}} at {{appetizer_time}}
- Main: {{main_address}} at {{main_time}}
- Dessert: {{dessert_address}} at {{dessert_time}}

Have a wonderful evening!

Best regards,
The Running Dinner Team`,
    type: 'reminder',
  },
  {
    id: 'tpl-4',
    name: 'Thank You',
    subject: 'Thank You for Joining {{event_name}}!',
    body: `Dear {{participant_name}},

Thank you so much for participating in {{event_name}}!

We hope you had a fantastic evening filled with great food, wonderful conversations, and new friendships.

We would love to hear your feedback! Please reply to this email with any comments or suggestions for future events.

Until next time!

Best regards,
The Running Dinner Team`,
    type: 'thank_you',
  },
]
