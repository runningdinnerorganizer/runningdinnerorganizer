// Nominatim geocoding — free, no API key needed
// Rate limit: max 1 request/second (we add 1.1s delay between calls)

export interface GeoResult {
  lat: number
  lng: number
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RunningDinnerOrganizer/1.0 (contact@runningdinnerorganizer.de)',
        'Accept-Language': 'de,en',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
