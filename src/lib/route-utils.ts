// Radius of the Earth in kilometers
const EARTH_RADIUS_KM = 6371;

export interface Coordinate {
  lat: number;
  lng: number;
}

export function validateCoordinate(coord: Coordinate): boolean {
  if (!coord || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
    return false;
  }
  return coord.lat >= -90 && coord.lat <= 90 && coord.lng >= -180 && coord.lng <= 180;
}

export function haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  if (!validateCoordinate(coord1) || !validateCoordinate(coord2)) {
    throw new Error('Invalid coordinates provided');
  }

  const toRad = (x: number): number => (x * Math.PI) / 180;

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export interface LocationData {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

export function parseCoordinatesFromCSV(csvContent: string): LocationData[] {
  try {
    const lines = csvContent.trim().split('\n');
    const locations: LocationData[] = [];

    for (const line of lines) {
      const parts = line.split(',').map(part => part.trim());
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinate values in CSV');
      }

      const coord = { lat, lng };
      if (!validateCoordinate(coord)) {
        throw new Error('Coordinates out of valid range');
      }

      const location: LocationData = {
        lat,
        lng,
        name: parts[2],
        address: parts[3]
      };

      locations.push(location);
    }

    return locations;
  } catch (error) {
    throw new Error('Failed to parse CSV: ' + (error as Error).message);
  }
}

export interface RoutePoint extends LocationData {
  distance: number;
  order: number;
}

export function calculateRoute(start: Coordinate, destinations: LocationData[]): RoutePoint[] {
  const points = destinations.map(dest => ({
    ...dest,
    distance: haversineDistance(start, dest),
    order: 0,
  }));

  return points.sort((a, b) => a.distance - b.distance)
    .map((point, index) => ({
      ...point,
      order: index + 1,
    }));
}
