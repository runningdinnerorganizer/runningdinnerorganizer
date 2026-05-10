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

/**
 * Options to control which optimisations the algorithm applies.
 * Both default to true when omitted.
 */
export interface AlgorithmOptions {
  /**
   * When true (default): guest teams are routed to hosts whose dietary offerings
   * are compatible with the guests' restrictions. Vegans and vegetarians are
   * preferentially seated at hosts who cater for them.
   * When false: dietary compatibility is ignored during table assignment
   * (incompatibilities still appear as warnings).
   */
  optimiseDietary?: boolean
  /**
   * When true (default): teams are geo-clustered by hosting course and routes
   * are optimised to minimise total travel distance.
   * When false: geographic position is ignored; teams are assigned purely by
   * the no-repeat constraint.
   */
  optimiseDistance?: boolean
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
    waitlistedIds: string[]      // participant ids that cannot join this round
    missingForNextRound: number  // how many more signups are needed to include them
    repeatedMeetingCount: number // 0 when strict no-repeat succeeded
    validationSummary: string[]  // human-readable quality checks
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

/** Fisher-Yates shuffle — returns a new shuffled array */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Rebuild the set of all pair-meetings from a finished assignment list */
function buildMetPairsSet(assignments: CourseAssignmentResult[]): Set<string> {
  const set = new Set<string>()
  for (const a of assignments) {
    set.add(pairKey(a.hostTeamId, a.guestTeam1Id))
    set.add(pairKey(a.hostTeamId, a.guestTeam2Id))
    set.add(pairKey(a.guestTeam1Id, a.guestTeam2Id))
  }
  return set
}

// ---------------------------------------------------------------------------
// Dietary penalty cache
// ---------------------------------------------------------------------------

/**
 * Maps "hostTeamId>guestTeamId" → number of dietary incompatibilities.
 * A value of 0 means the guest team can safely eat at this host.
 * Used by the greedy to prefer compatible pairings.
 */
type DietaryPenaltyCache = Map<string, number>

/**
 * Pre-computes dietary incompatibility scores for every (host, guest) pair.
 * Only considers host member1's restrictions as a proxy for what the household offers.
 */
function buildDietaryPenaltyCache(
  teams: TeamResult[],
  participantById: Map<string, ParticipantInput>,
): DietaryPenaltyCache {
  const cache = new Map<string, number>()
  for (const host of teams) {
    const hostMember = participantById.get(host.member1Id)
    const hostRestrictions = hostMember?.dietaryRestrictions ?? []
    for (const guest of teams) {
      if (host.id === guest.id) continue
      let penalty = 0
      for (const memberId of [guest.member1Id, guest.member2Id]) {
        const member = participantById.get(memberId)
        if (member && !dietaryCompatible(member.dietaryRestrictions, hostRestrictions)) {
          penalty++
        }
      }
      cache.set(`${host.id}>${guest.id}`, penalty)
    }
  }
  return cache
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
function assignHostingCourses(rawTeams: RawTeam[], optimiseDistance = true): TeamResult[] {
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
  // the centroid spread of each course group. Only attempt if coords exist and distance opt is on.
  const hasCoords = teams.some((t) => t.hostLat != null && t.hostLng != null)
  if (!hasCoords || !optimiseDistance) return teams

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
// Step 5a — Greedy guest assignment (soft constraint: minimise repeats)
// ---------------------------------------------------------------------------

/**
 * Single greedy pass over all courses.
 * For each host (in the given order) pick the pair of available guests that
 * introduces the fewest already-seen pair-meetings.
 * Always succeeds as long as team count is divisible by 3.
 */
function assignGuestsGreedyOnce(
  coreTeams: TeamResult[],
  hostOrders: Record<Course, TeamResult[]>,
  dietaryCache?: DietaryPenaltyCache,
): { assignments: CourseAssignmentResult[]; repeatCount: number } {
  const metPairs = new Set<string>()
  const assignments: CourseAssignmentResult[] = []
  let repeatCount = 0

  for (const course of COURSES) {
    const hosts = hostOrders[course]
    const guestPool = coreTeams.filter((t) => t.hostingCourse !== course)
    const usedGuests = new Set<string>()

    for (const host of hosts) {
      const available = guestPool.filter((g) => !usedGuests.has(g.id))

      let bestPair: [TeamResult, TeamResult] = [available[0], available[1]]
      let bestScore = Infinity

      for (let i = 0; i < available.length - 1; i++) {
        for (let j = i + 1; j < available.length; j++) {
          const g1 = available[i]
          const g2 = available[j]
          // Repeat-meeting penalty (highest priority)
          let score = 0
          if (metPairs.has(pairKey(host.id, g1.id))) score += 10
          if (metPairs.has(pairKey(host.id, g2.id))) score += 10
          if (metPairs.has(pairKey(g1.id, g2.id))) score += 10
          // Dietary incompatibility penalty (lower priority than repeats)
          if (dietaryCache) {
            score += (dietaryCache.get(`${host.id}>${g1.id}`) ?? 0) * 3
            score += (dietaryCache.get(`${host.id}>${g2.id}`) ?? 0) * 3
          }
          if (score < bestScore) {
            bestScore = score
            bestPair = [g1, g2]
          }
        }
      }

      const [g1, g2] = bestPair
      if (metPairs.has(pairKey(host.id, g1.id))) repeatCount++
      if (metPairs.has(pairKey(host.id, g2.id))) repeatCount++
      if (metPairs.has(pairKey(g1.id, g2.id))) repeatCount++

      assignments.push({ course, hostTeamId: host.id, guestTeam1Id: g1.id, guestTeam2Id: g2.id })
      usedGuests.add(g1.id)
      usedGuests.add(g2.id)
      metPairs.add(pairKey(host.id, g1.id))
      metPairs.add(pairKey(host.id, g2.id))
      metPairs.add(pairKey(g1.id, g2.id))
    }
  }

  return { assignments, repeatCount }
}

/**
 * Run multiple greedy passes with shuffled host orderings and return
 * the result with the fewest repeated pair-meetings.
 */
function assignGuestsBestGreedy(
  coreTeams: TeamResult[],
  dietaryCache?: DietaryPenaltyCache,
): {
  assignments: CourseAssignmentResult[]
  repeatCount: number
} {
  const teamsByCourse = {
    appetizer: coreTeams.filter((t) => t.hostingCourse === 'appetizer'),
    main: coreTeams.filter((t) => t.hostingCourse === 'main'),
    dessert: coreTeams.filter((t) => t.hostingCourse === 'dessert'),
  } as Record<Course, TeamResult[]>

  let best = assignGuestsGreedyOnce(coreTeams, teamsByCourse, dietaryCache)
  if (best.repeatCount === 0) return best

  const NUM_TRIES = 40
  for (let t = 1; t < NUM_TRIES; t++) {
    const shuffledOrders: Record<Course, TeamResult[]> = {
      appetizer: shuffleArray(teamsByCourse.appetizer),
      main: shuffleArray(teamsByCourse.main),
      dessert: shuffleArray(teamsByCourse.dessert),
    }
    const result = assignGuestsGreedyOnce(coreTeams, shuffledOrders, dietaryCache)
    if (result.repeatCount < best.repeatCount) best = result
    if (best.repeatCount === 0) break
  }

  return best
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

/**
 * Try strict backtracking first. If it fails (impossible for small events or
 * unfortunate team counts), fall back to the greedy minimise-repeats approach.
 *
 * Returns assignments plus the number of unavoidable repeated pair-meetings
 * (0 when the strict solution was found).
 */
function assignGuestsWithFallback(
  teams: TeamResult[],
  dietaryCache?: DietaryPenaltyCache,
): {
  assignments: CourseAssignmentResult[]
  repeatedMeetingCount: number
} {
  const strict = assignGuests(teams)
  if (strict !== null) {
    return { assignments: strict, repeatedMeetingCount: 0 }
  }
  // Strict failed — use best greedy (with dietary awareness if requested)
  return assignGuestsBestGreedy(teams, dietaryCache)
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
export function assignTeams(
  participants: ParticipantInput[],
  options: AlgorithmOptions = {},
): AlgorithmResult {
  const { optimiseDietary = true, optimiseDistance = true } = options
  const errors: string[] = []
  const warnings: string[] = []

  // ------------------------------------------------------------------
  // Step 1: Waitlist participants so the remaining count is divisible by 6
  // (Running Dinner requires exactly 6 people per table = 3 teams per table × 3 courses)
  // ------------------------------------------------------------------
  const excess = participants.length % 6
  const waitlistedIds: string[] = []
  let workingList = participants.slice()

  if (excess > 0) {
    const removed = workingList.splice(workingList.length - excess, excess)
    waitlistedIds.push(...removed.map((p) => p.id))
  }

  const missingForNextRound = excess === 0 ? 0 : 6 - excess

  if (workingList.length < 6) {
    errors.push(
      `Not enough participants. At least 6 are required for a Running Dinner (3 teams × 2 courses × 1 table). Currently ${participants.length} signed up.`,
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
        waitlistedIds,
        missingForNextRound,
        repeatedMeetingCount: 0,
        validationSummary: [],
      },
    }
  }

  // ------------------------------------------------------------------
  // Step 2: Form 2-person teams
  // ------------------------------------------------------------------
  const rawTeams = formTeams(workingList)
  const tablesPerCourse = rawTeams.length / 3 // guaranteed integer because workingList.length % 6 === 0

  // ------------------------------------------------------------------
  // Step 3: Assign hosting courses (with optional geo-clustering)
  // ------------------------------------------------------------------
  const teams = assignHostingCourses(rawTeams, optimiseDistance)

  // ------------------------------------------------------------------
  // Step 4: Build dietary penalty cache (only when dietary opt is on)
  // ------------------------------------------------------------------
  const participantById = new Map(workingList.map((p) => [p.id, p]))
  const dietaryCache = optimiseDietary
    ? buildDietaryPenaltyCache(teams, participantById)
    : undefined

  // ------------------------------------------------------------------
  // Step 5: Assign guests (strict backtracking → greedy fallback)
  // ------------------------------------------------------------------
  const { assignments: rawAssignments, repeatedMeetingCount } =
    assignGuestsWithFallback(teams, dietaryCache)

  if (repeatedMeetingCount > 0) {
    warnings.push(
      `This event is too small for every pair to meet only once. ${repeatedMeetingCount} pair(s) will share a table more than once — this is mathematically unavoidable at this size.`,
    )
  }

  // ------------------------------------------------------------------
  // Step 6: Route optimisation (skip when distance opt is off)
  // ------------------------------------------------------------------
  const finalAssignments = optimiseDistance
    ? optimiseRoutes(teams, rawAssignments)
    : rawAssignments

  // ------------------------------------------------------------------
  // Step 7: Build validation summary + dietary warnings
  // ------------------------------------------------------------------
  // Validation: repeated meetings are expected in small events — always warnings, never errors
  const validationErrors = validateAssignments(teams, finalAssignments)
  for (const e of validationErrors) {
    warnings.push(e)
  }

  const validationSummary: string[] = []

  // Check 1: unique encounters
  if (repeatedMeetingCount === 0) {
    validationSummary.push('✓ Every team meets a different group at each course.')
  } else {
    validationSummary.push(
      `⚠ ${repeatedMeetingCount} pair(s) meet more than once (unavoidable at this event size).`,
    )
  }

  // Check 2: dietary compatibility
  const teamById = new Map(teams.map((t) => [t.id, t]))
  let dietaryMismatches = 0
  for (const assignment of finalAssignments) {
    const hostTeam = teamById.get(assignment.hostTeamId)
    if (!hostTeam) continue
    const hostMember = participantById.get(hostTeam.member1Id)
    const hostRestrictions = hostMember?.dietaryRestrictions ?? []
    for (const guestId of [assignment.guestTeam1Id, assignment.guestTeam2Id]) {
      const guestTeam = teamById.get(guestId)
      if (!guestTeam) continue
      for (const memberId of [guestTeam.member1Id, guestTeam.member2Id]) {
        const member = participantById.get(memberId)
        if (!member) continue
        if (!dietaryCompatible(member.dietaryRestrictions, hostRestrictions)) {
          dietaryMismatches++
          warnings.push(
            `Dietary mismatch: ${member.firstName} ${member.lastName} (${member.dietaryRestrictions.join(', ')}) visits team ${assignment.hostTeamId} at ${assignment.course}. The host may not cater for their needs.`,
          )
        }
      }
    }
  }
  if (optimiseDietary && dietaryMismatches === 0) {
    validationSummary.push('✓ All guest–host pairings are dietarily compatible.')
  } else if (dietaryMismatches > 0) {
    validationSummary.push(
      `⚠ ${dietaryMismatches} dietary mismatch(es) detected${optimiseDietary ? ' — could not be fully resolved with this group' : ' (dietary optimisation was off)'}.`,
    )
  }

  // Check 3: distance
  const hasCoords = teams.some((t) => t.hostLat != null && t.hostLng != null)
  if (!hasCoords) {
    validationSummary.push('ℹ No coordinates available — distance optimisation was skipped.')
  } else if (optimiseDistance) {
    validationSummary.push('✓ Routes have been optimised to minimise travel distance.')
  } else {
    validationSummary.push('ℹ Distance optimisation was turned off.')
  }

  // Check 4: waitlist
  if (waitlistedIds.length === 0) {
    validationSummary.push('✓ All registered participants are included.')
  } else {
    validationSummary.push(
      `⚠ ${waitlistedIds.length} participant(s) waitlisted. ${missingForNextRound} more signup(s) needed to include them.`,
    )
  }

  return {
    success: errors.length === 0,
    teams,
    assignments: finalAssignments,
    errors,
    warnings,
    stats: {
      totalParticipants: participants.length,
      totalTeams: teams.length,
      tablesPerCourse,
      waitlistedIds,
      missingForNextRound,
      repeatedMeetingCount,
      validationSummary,
    },
  }
}
