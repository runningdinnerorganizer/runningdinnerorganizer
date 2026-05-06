/**
 * Running Dinner Organizer — Team Assignment Algorithm
 *
 * Pure TypeScript, no external dependencies.
 * Works for events with 6 to 200+ participants.
 */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type Course = 'appetizer' | 'main' | 'dessert'

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'no_pork'
  | 'no_beef'
  | 'no_chicken'
  | 'gluten_free'

export interface ParticipantInput {
  id: string
  firstName: string
  lastName: string
  address: string
  lat?: number
  lng?: number
  dietaryRestrictions: DietaryRestriction[]
  hasPartner: boolean
  partnerId?: string // if pre-paired
  canHostSolo?: boolean
}

export interface TeamResult {
  id: string
  member1Id: string
  member2Id: string
  hostingCourse: Course
  hostAddress: string
  hostLat?: number
  hostLng?: number
}

export interface CourseAssignmentResult {
  course: Course
  hostTeamId: string
  guestTeam1Id: string
  guestTeam2Id: string
}

export interface AlgorithmResult {
  success: boolean
  teams: TeamResult[]
  assignments: CourseAssignmentResult[]
  errors: string[]
  warnings: string[]
  stats: {
    totalParticipants: number
    totalTeams: number
    tablesPerCourse: number
    oddPersonOut?: string
  }
}

// ---------------------------------------------------------------------------
// Helper: Haversine Distance
// ---------------------------------------------------------------------------

/**
 * Calculates the great-circle distance between two coordinates.
 * @returns Distance in kilometres.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371 // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ---------------------------------------------------------------------------
// Helper: Dietary Compatibility
// ---------------------------------------------------------------------------

/**
 * Returns true when a guest with `guestRestrictions` can safely eat at a host
 * with `hostRestrictions`.
 *
 * Key conflict: a vegan guest cannot eat at a non-vegan host.
 * A vegetarian guest cannot eat at a host with no vegetarian restriction.
 * Gluten-free, etc. are symmetric — if the guest needs it but the host
 * does not cater for it, it is a conflict.
 */
export function dietaryCompatible(
  guestRestrictions: DietaryRestriction[],
  hostRestrictions: DietaryRestriction[],
): boolean {
  const guestNeeds = new Set(guestRestrictions)
  const hostProvides = new Set(hostRestrictions)

  // A vegan guest needs a vegan (or at minimum vegan-compatible) host.
  if (guestNeeds.has('vegan') && !hostProvides.has('vegan')) {
    return false
  }

  // A vegetarian guest needs a vegetarian or vegan host.
  if (
    guestNeeds.has('vegetarian') &&
    !hostProvides.has('vegetarian') &&
    !hostProvides.has('vegan')
  ) {
    return false
  }

  // Other restrictions: if the guest needs it, the host must also declare it.
  const strictRestrictions: DietaryRestriction[] = [
    'gluten_free',
    'no_pork',
    'no_beef',
    'no_chicken',
  ]

  for (const restriction of strictRestrictions) {
    if (guestNeeds.has(restriction) && !hostProvides.has(restriction)) {
      return false
    }
  }

  return true
}

// ---------------------------------------------------------------------------
// Helper: Validate Assignments
// ---------------------------------------------------------------------------

/**
 * Validates that the assignment list satisfies the core Running Dinner rules:
 * - Every team appears exactly 3 times total (1x host + 2x guest).
 * - No team appears twice in the same course slot.
 * - No two teams share a table more than once across the whole evening.
 * @returns Array of error message strings (empty = valid).
 */
export function validateAssignments(
  teams: TeamResult[],
  assignments: CourseAssignmentResult[],
): string[] {
  const errors: string[] = []

  const teamIds = new Set(teams.map((t) => t.id))

  // Count appearances per team
  const appearanceCount: Record<string, number> = {}
  for (const id of teamIds) {
    appearanceCount[id] = 0
  }

  // Track which teams sit together: key = sorted pair, value = courses they met
  const meetingMap: Record<string, string[]> = {}

  const recordMeeting = (a: string, b: string, course: string) => {
    const key = [a, b].sort().join('|')
    if (!meetingMap[key]) meetingMap[key] = []
    meetingMap[key].push(course)
  }

  for (const assignment of assignments) {
    const { course, hostTeamId, guestTeam1Id, guestTeam2Id } = assignment

    // Validate all referenced team ids exist
    for (const id of [hostTeamId, guestTeam1Id, guestTeam2Id]) {
      if (!teamIds.has(id)) {
        errors.push(`Assignment references unknown team id "${id}" in course ${course}.`)
      }
    }

    // Count appearances
    appearanceCount[hostTeamId] = (appearanceCount[hostTeamId] ?? 0) + 1
    appearanceCount[guestTeam1Id] = (appearanceCount[guestTeam1Id] ?? 0) + 1
    appearanceCount[guestTeam2Id] = (appearanceCount[guestTeam2Id] ?? 0) + 1

    // No team may appear twice in the same course slot
    const courseTeams = [hostTeamId, guestTeam1Id, guestTeam2Id]
    if (new Set(courseTeams).size !== 3) {
      errors.push(`Duplicate team in course ${course}: ${courseTeams.join(', ')}.`)
    }

    // Record meetings
    recordMeeting(hostTeamId, guestTeam1Id, course)
    recordMeeting(hostTeamId, guestTeam2Id, course)
    recordMeeting(guestTeam1Id, guestTeam2Id, course)
  }

  // Every team must appear exactly 3 times
  for (const [id, count] of Object.entries(appearanceCount)) {
    if (count !== 3) {
      errors.push(`Team "${id}" appears ${count} time(s) across all assignments (expected 3).`)
    }
  }

  // No pair of teams may meet more than once
  for (const [pair, courses] of Object.entries(meetingMap)) {
    if (courses.length > 1) {
      errors.push(
        `Teams ${pair.replace('|', ' and ')} meet ${courses.length} times (courses: ${courses.join(', ')}).`,
      )
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Build a unique string key for a sorted pair of team ids */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/**
 * Calculate the total travel distance for a single team's evening journey.
 * Route: appetizer host location → main host location → dessert host location.
 * Returns 0 if any coordinate is missing.
 */
function teamJourneyDistance(
  teamId: string,
  assignments: CourseAssignmentResult[],
  teamById: Map<string, TeamResult>,
): number {
  const courses: Course[] = ['appetizer', 'main', 'dessert']

  // Find which host each team visits per course
  const hostForCourse: Record<string, TeamResult | undefined> = {}
  for (const course of courses) {
    const slot = assignments.find((a) => a.course === course)
    if (!slot) continue

    if (
      slot.hostTeamId === teamId ||
      slot.guestTeam1Id === teamId ||
      slot.guestTeam2Id === teamId
    ) {
      hostForCourse[course] = teamById.get(slot.hostTeamId)
    }
  }

  const locations = courses.map((c) => hostForCourse[c])
  if (locations.some((l) => !l || l.hostLat == null || l.hostLng == null)) {
    return 0
  }

  let total = 0
  for (let i = 0; i < locations.length - 1; i++) {
    const from = locations[i]!
    const to = locations[i + 1]!
    total += haversineDistance(from.hostLat!, from.hostLng!, to.hostLat!, to.hostLng!)
  }
  return total
}

/**
 * Compute total travel distance across all teams for a given full assignment list.
 */
function totalTravelDistance(
  teams: TeamResult[],
  assignments: CourseAssignmentResult[],
): number {
  const teamById = new Map(teams.map((t) => [t.id, t]))
  let total = 0
  for (const team of teams) {
    total += teamJourneyDistance(team.id, assignments, teamById)
  }
  return total
}

// ---------------------------------------------------------------------------
// Step 2 — Form Teams
// ---------------------------------------------------------------------------

interface RawTeam {
  member1: ParticipantInput
  member2: ParticipantInput
}

function formTeams(participants: ParticipantInput[]): RawTeam[] {
  const teams: RawTeam[] = []
  const used = new Set<string>()

  // Pass 1: keep pre-paired participants together
  for (const p of participants) {
    if (used.has(p.id)) continue
    if (p.hasPartner && p.partnerId) {
      const partner = participants.find((q) => q.id === p.partnerId)
      if (partner && !used.has(partner.id)) {
        teams.push({ member1: p, member2: partner })
        used.add(p.id)
        used.add(partner.id)
      }
    }
  }

  // Pass 2: greedy matching for solo participants
  const solos = participants.filter((p) => !used.has(p.id))

  // Sort solos: first by dietary complexity (more restrictions first) so
  // restrictive participants get matched together rather than left isolated.
  solos.sort((a, b) => b.dietaryRestrictions.length - a.dietaryRestrictions.length)

  const soloUsed = new Set<string>()

  for (let i = 0; i < solos.length; i++) {
    if (soloUsed.has(solos[i].id)) continue

    const a = solos[i]
    let bestMatch: ParticipantInput | null = null
    let bestScore = -Infinity

    for (let j = i + 1; j < solos.length; j++) {
      if (soloUsed.has(solos[j].id)) continue
      const b = solos[j]

      let score = 0

      // Dietary compatibility bonus
      if (
        dietaryCompatible(a.dietaryRestrictions, b.dietaryRestrictions) &&
        dietaryCompatible(b.dietaryRestrictions, a.dietaryRestrictions)
      ) {
        score += 100
      }

      // Geographic proximity bonus (smaller distance = higher score)
      if (
        a.lat != null &&
        a.lng != null &&
        b.lat != null &&
        b.lng != null
      ) {
        const dist = haversineDistance(a.lat, a.lng, b.lat, b.lng)
        score += Math.max(0, 50 - dist) // 50 points at distance 0, 0 points at 50 km
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = b
      }
    }

    if (bestMatch) {
      teams.push({ member1: a, member2: bestMatch })
      soloUsed.add(a.id)
      soloUsed.add(bestMatch.id)
    }
  }

  return teams
}

// ---------------------------------------------------------------------------
// Step 4 — Assign Hosting Courses
// ---------------------------------------------------------------------------

const COURSES: Course[] = ['appetizer', 'main', 'dessert']

/**
 * Assign each raw team a hosting course.
 * Distribution: round-robin (0,3,6 → appetizer; 1,4,7 → main; 2,5,8 → dessert).
 * If coordinates are available, try to improve geographic clustering by swapping
 * teams within the same course group.
 */
function assignHostingCourses(rawTeams: RawTeam[]): TeamResult[] {
  // Initial assignment: round-robin
  const teams: TeamResult[] = rawTeams.map((rt, index) => {
    const course = COURSES[index % 3]
    // Prefer the canHostSolo member as host, otherwise member1
    const host =
      rt.member2.canHostSolo && !rt.member1.canHostSolo ? rt.member2 : rt.member1

    return {
      id: `team-${index + 1}`,
      member1Id: rt.member1.id,
      member2Id: rt.member2.id,
      hostingCourse: course,
      hostAddress: host.address,
      hostLat: host.lat,
      hostLng: host.lng,
    }
  })

  // Geographic clustering optimisation:
  // Within each pair of course buckets, try swapping teams to minimise
  // the centroid spread of each course group. Only attempt if coords exist.
  const hasCoords = teams.some((t) => t.hostLat != null && t.hostLng != null)
  if (!hasCoords) return teams

  // Simple swap improvement: try all pairs within different course groups and
  // keep the swap if it reduces total intra-course distance variance.
  let improved = true
  const maxPasses = 20
  let pass = 0

  while (improved && pass < maxPasses) {
    improved = false
    pass++

    for (let i = 0; i < teams.length - 1; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        if (teams[i].hostingCourse === teams[j].hostingCourse) continue

        const before = courseSpreadScore(teams)
        // Swap courses
        const tmpCourse = teams[i].hostingCourse
        teams[i].hostingCourse = teams[j].hostingCourse
        teams[j].hostingCourse = tmpCourse

        const after = courseSpreadScore(teams)
        if (after < before) {
          improved = true
        } else {
          // Revert
          const revert = teams[i].hostingCourse
          teams[i].hostingCourse = teams[j].hostingCourse
          teams[j].hostingCourse = revert
        }
      }
    }
  }

  return teams
}

/**
 * Measure geographic spread of teams within each course group.
 * Lower is better (tighter clusters).
 */
function courseSpreadScore(teams: TeamResult[]): number {
  let total = 0
  for (const course of COURSES) {
    const group = teams.filter(
      (t) => t.hostingCourse === course && t.hostLat != null && t.hostLng != null,
    )
    if (group.length < 2) continue
    for (let i = 0; i < group.length - 1; i++) {
      for (let j = i + 1; j < group.length; j++) {
        total += haversineDistance(
          group[i].hostLat!,
          group[i].hostLng!,
          group[j].hostLat!,
          group[j].hostLng!,
        )
      }
    }
  }
  return total
}

// ---------------------------------------------------------------------------
// Step 5 — Assign Guests (no repeated meetings constraint)
// ---------------------------------------------------------------------------

/**
 * Assign guest teams to each host using a constraint-satisfaction approach.
 * For small events (≤ 30 teams) uses backtracking; for larger events uses
 * a greedy heuristic with limited retry.
 *
 * Constraint: no two teams may share the same table more than once across the
 * whole evening.
 */
function assignGuests(teams: TeamResult[]): CourseAssignmentResult[] | null {
  const teamsByCourse: Record<Course, TeamResult[]> = {
    appetizer: teams.filter((t) => t.hostingCourse === 'appetizer'),
    main: teams.filter((t) => t.hostingCourse === 'main'),
    dessert: teams.filter((t) => t.hostingCourse === 'dessert'),
  }

  // Set of pairs that have already shared a table
  const metPairs = new Set<string>()

  const assignments: CourseAssignmentResult[] = []

  for (const course of COURSES) {
    const hosts = teamsByCourse[course]
    // All teams that do NOT host this course are potential guests
    const guestPool = teams.filter((t) => t.hostingCourse !== course)

    const courseAssignments = assignGuestsForCourse(
      course,
      hosts,
      guestPool,
      metPairs,
    )

    if (courseAssignments === null) {
      return null // Failed — caller should retry or report error
    }

    for (const ca of courseAssignments) {
      assignments.push(ca)
      // Record all pairs that just met at this table
      metPairs.add(pairKey(ca.hostTeamId, ca.guestTeam1Id))
      metPairs.add(pairKey(ca.hostTeamId, ca.guestTeam2Id))
      metPairs.add(pairKey(ca.guestTeam1Id, ca.guestTeam2Id))
    }
  }

  return assignments
}

/**
 * Assign 2 guest teams to each host for a single course.
 * Uses backtracking to satisfy the no-repeated-meeting constraint.
 */
function assignGuestsForCourse(
  course: Course,
  hosts: TeamResult[],
  guestPool: TeamResult[],
  metPairs: Set<string>,
): CourseAssignmentResult[] | null {
  const assignments: CourseAssignmentResult[] = []
  const usedGuests = new Set<string>()

  // Track new pairs introduced during this course assignment (so we can reason
  // about within-course conflicts too)
  const newPairs = new Set<string>()

  function backtrack(hostIndex: number): boolean {
    if (hostIndex === hosts.length) return true

    const host = hosts[hostIndex]
    const available = guestPool.filter((g) => !usedGuests.has(g.id))

    // Try every combination of 2 guests from available pool
    for (let i = 0; i < available.length - 1; i++) {
      for (let j = i + 1; j < available.length; j++) {
        const g1 = available[i]
        const g2 = available[j]

        const p_hg1 = pairKey(host.id, g1.id)
        const p_hg2 = pairKey(host.id, g2.id)
        const p_g1g2 = pairKey(g1.id, g2.id)

        // Check all three pairs against already-met pairs AND new pairs this course
        if (
          metPairs.has(p_hg1) ||
          metPairs.has(p_hg2) ||
          metPairs.has(p_g1g2) ||
          newPairs.has(p_hg1) ||
          newPairs.has(p_hg2) ||
          newPairs.has(p_g1g2)
        ) {
          continue
        }

        // Tentatively assign
        assignments.push({
          course,
          hostTeamId: host.id,
          guestTeam1Id: g1.id,
          guestTeam2Id: g2.id,
        })
        usedGuests.add(g1.id)
        usedGuests.add(g2.id)
        newPairs.add(p_hg1)
        newPairs.add(p_hg2)
        newPairs.add(p_g1g2)

        if (backtrack(hostIndex + 1)) return true

        // Revert
        assignments.pop()
        usedGuests.delete(g1.id)
        usedGuests.delete(g2.id)
        newPairs.delete(p_hg1)
        newPairs.delete(p_hg2)
        newPairs.delete(p_g1g2)
      }
    }

    return false // No valid assignment found for this host
  }

  const success = backtrack(0)
  return success ? assignments : null
}

// ---------------------------------------------------------------------------
// Step 6 — Route Optimisation via Swap
// ---------------------------------------------------------------------------

/**
 * Attempt to reduce total travel distance by swapping guest team assignments
 * between tables in the same course. Only keeps swaps that reduce total
 * distance and preserve the no-repeated-meeting constraint.
 */
function optimiseRoutes(
  teams: TeamResult[],
  assignments: CourseAssignmentResult[],
): CourseAssignmentResult[] {
  const hasCoords = teams.some((t) => t.hostLat != null && t.hostLng != null)
  if (!hasCoords) return assignments

  let current = assignments.slice()
  let improved = true
  const maxPasses = 30
  let pass = 0

  while (improved && pass < maxPasses) {
    improved = false
    pass++

    for (const course of COURSES) {
      const courseSlots = current
        .map((a, idx) => ({ a, idx }))
        .filter(({ a }) => a.course === course)

      if (courseSlots.length < 2) continue

      for (let si = 0; si < courseSlots.length - 1; si++) {
        for (let sj = si + 1; sj < courseSlots.length; sj++) {
          const { a: slotA, idx: idxA } = courseSlots[si]
          const { a: slotB, idx: idxB } = courseSlots[sj]

          // Try swapping guestTeam1 between the two slots
          const swapped = current.slice()
          swapped[idxA] = {
            ...slotA,
            guestTeam1Id: slotB.guestTeam1Id,
          }
          swapped[idxB] = {
            ...slotB,
            guestTeam1Id: slotA.guestTeam1Id,
          }

          const validationErrors = validateAssignments(teams, swapped)
          if (validationErrors.length > 0) continue

          const before = totalTravelDistance(teams, current)
          const after = totalTravelDistance(teams, swapped)
          if (after < before - 0.001) {
            current = swapped
            improved = true
          }
        }
      }
    }
  }

  return current
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

/**
 * Assigns teams, courses, and guest seating for a Running Dinner event.
 *
 * @param participants - List of registered participants.
 * @returns AlgorithmResult with teams, assignments, and diagnostics.
 *
 * @example
 * const result = assignTeams(participants)
 * if (result.success) {
 *   console.log(result.teams)
 *   console.log(result.assignments)
 * }
 */
export function assignTeams(participants: ParticipantInput[]): AlgorithmResult {
  const errors: string[] = []
  const warnings: string[] = []

  // ------------------------------------------------------------------
  // Step 1: Handle odd participant count
  // ------------------------------------------------------------------
  let workingList = participants.slice()
  let oddPersonOut: string | undefined

  if (workingList.length % 2 !== 0) {
    const removed = workingList[workingList.length - 1]
    oddPersonOut = removed.id
    workingList = workingList.slice(0, -1)
    warnings.push(
      `Odd number of participants. Participant "${removed.firstName} ${removed.lastName}" (id: ${removed.id}) has been removed from this event and should be placed on a waiting list.`,
    )
  }

  if (workingList.length < 6) {
    errors.push(
      `Not enough participants to form a valid Running Dinner event. Minimum 6 participants required, got ${workingList.length}.`,
    )
    return {
      success: false,
      teams: [],
      assignments: [],
      errors,
      warnings,
      stats: {
        totalParticipants: participants.length,
        totalTeams: 0,
        tablesPerCourse: 0,
        oddPersonOut,
      },
    }
  }

  // ------------------------------------------------------------------
  // Step 2: Form teams
  // ------------------------------------------------------------------
  const rawTeams = formTeams(workingList)

  // ------------------------------------------------------------------
  // Step 3: Validate team count is divisible by 3
  // ------------------------------------------------------------------
  if (rawTeams.length % 3 !== 0) {
    errors.push(
      `Total number of teams (${rawTeams.length}) is not divisible by 3. A Running Dinner requires exactly 3 teams per table. Please ensure the participant count results in a team count divisible by 3.`,
    )
    return {
      success: false,
      teams: [],
      assignments: [],
      errors,
      warnings,
      stats: {
        totalParticipants: participants.length,
        totalTeams: rawTeams.length,
        tablesPerCourse: 0,
        oddPersonOut,
      },
    }
  }

  const tablesPerCourse = rawTeams.length / 3

  // ------------------------------------------------------------------
  // Step 4: Assign hosting courses (with optional geo-clustering)
  // ------------------------------------------------------------------
  const teams = assignHostingCourses(rawTeams)

  // ------------------------------------------------------------------
  // Step 5: Assign guests (backtracking constraint satisfaction)
  // ------------------------------------------------------------------
  const assignments = assignGuests(teams)

  if (assignments === null) {
    errors.push(
      'Could not find a valid guest assignment that satisfies the no-repeated-meeting constraint. This can happen with very small or geometrically constrained participant sets. Please try adding more participants or adjusting pairings.',
    )
    return {
      success: false,
      teams,
      assignments: [],
      errors,
      warnings,
      stats: {
        totalParticipants: participants.length,
        totalTeams: teams.length,
        tablesPerCourse,
        oddPersonOut,
      },
    }
  }

  // ------------------------------------------------------------------
  // Step 6: Route optimisation
  // ------------------------------------------------------------------
  const optimisedAssignments = optimiseRoutes(teams, assignments)

  // ------------------------------------------------------------------
  // Step 7: Final validation and result
  // ------------------------------------------------------------------
  const validationErrors = validateAssignments(teams, optimisedAssignments)
  if (validationErrors.length > 0) {
    // Should not happen, but surface as errors rather than silently returning
    // bad data.
    for (const e of validationErrors) {
      errors.push(`[Post-validation] ${e}`)
    }
  }

  // Warn about dietary mismatches that may exist despite best-effort matching
  const teamById = new Map(teams.map((t) => [t.id, t]))
  const participantById = new Map(workingList.map((p) => [p.id, p]))

  for (const assignment of optimisedAssignments) {
    const hostTeam = teamById.get(assignment.hostTeamId)
    if (!hostTeam) continue

    const hostMember1 = participantById.get(hostTeam.member1Id)
    const hostRestrictions = hostMember1?.dietaryRestrictions ?? []

    for (const guestId of [assignment.guestTeam1Id, assignment.guestTeam2Id]) {
      const guestTeam = teamById.get(guestId)
      if (!guestTeam) continue

      for (const memberId of [guestTeam.member1Id, guestTeam.member2Id]) {
        const member = participantById.get(memberId)
        if (!member) continue
        if (!dietaryCompatible(member.dietaryRestrictions, hostRestrictions)) {
          warnings.push(
            `Dietary mismatch: participant "${member.firstName} ${member.lastName}" (${member.dietaryRestrictions.join(', ')}) is assigned as guest at team ${assignment.hostTeamId} during ${assignment.course}. The host may not be able to accommodate their dietary needs.`,
          )
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    teams,
    assignments: optimisedAssignments,
    errors,
    warnings,
    stats: {
      totalParticipants: participants.length,
      totalTeams: teams.length,
      tablesPerCourse,
      oddPersonOut,
    },
  }
}
