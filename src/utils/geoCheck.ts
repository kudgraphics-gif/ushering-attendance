/**
 * Geo-check utility for proximity validation against venue locations.
 * Uses the Haversine formula to compute great-circle distance in metres.
 */

export interface VenueLocation {
    name: string;
    lat: number;
    lng: number;
}

/** All known venue locations */
export const VENUES: VenueLocation[] = [
    {
        name: 'Chida',
        lat: 9.070818996337124,
        lng: 7.434377769114212,
    },
    {
        name: 'DOA',
        lat: 9.076381,
        lng: 7.431592,
    },
];

/** Allowed radius in metres around any venue centre */
export const PERIMETER_RADIUS_METERS = 200;

/**
 * Haversine formula — returns distance in metres between two geo-coordinates.
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6_371_000; // Earth's radius in metres
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export interface NearestVenueResult {
    /** Name of the closest venue */
    name: string;
    /** Distance to that venue in metres */
    distanceMeters: number;
    /** Whether the user is within PERIMETER_RADIUS_METERS */
    isWithin: boolean;
}

/**
 * Returns information about the nearest venue and whether the user is within the perimeter.
 */
export function getNearestVenue(userLat: number, userLng: number): NearestVenueResult {
    let nearest: NearestVenueResult | null = null;

    for (const venue of VENUES) {
        const dist = calculateDistance(userLat, userLng, venue.lat, venue.lng);
        if (!nearest || dist < nearest.distanceMeters) {
            nearest = {
                name: venue.name,
                distanceMeters: Math.round(dist),
                isWithin: dist <= PERIMETER_RADIUS_METERS,
            };
        }
    }

    // Fallback (should never happen since VENUES is non-empty)
    return nearest!;
}
