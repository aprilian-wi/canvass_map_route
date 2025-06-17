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
  visited: boolean;
}

export function calculateRoute(start: Coordinate, destinations: LocationData[]): RoutePoint[] {
  // Initialize variables
  const unvisited = [...destinations];
  const route: RoutePoint[] = [];
  let currentPoint: Coordinate = start;
  let totalDistance = 0;

  // Find nearest neighbor repeatedly until all points are visited
  while (unvisited.length > 0) {
    // Find the nearest unvisited point
    let nearestIndex = 0;
    let shortestDistance = haversineDistance(currentPoint, unvisited[0]);

    for (let i = 1; i < unvisited.length; i++) {
      const distance = haversineDistance(currentPoint, unvisited[i]);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = i;
      }
    }

    // Add the nearest point to the route
    const nextPoint = unvisited[nearestIndex];
    totalDistance += shortestDistance;

    route.push({
      ...nextPoint,
      order: route.length + 1,
      distance: totalDistance, // Cumulative distance from start
      visited: false
    });

    // Update current point and remove visited point
    currentPoint = nextPoint;
    unvisited.splice(nearestIndex, 1);
  }

  return route;
}
