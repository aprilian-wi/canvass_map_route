"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Map.module.css';
import { Coordinate, RoutePoint } from '@/lib/route-utils';

interface MapProps {
  startPoint: Coordinate;
  route: RoutePoint[];
}

export default function Map({ startPoint, route }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerId = 'map';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize map if it hasn't been initialized yet
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerId).setView([startPoint.lat, startPoint.lng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing markers and paths
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Add start point marker
    L.marker([startPoint.lat, startPoint.lng], {
      title: 'Start Point',
      icon: L.divIcon({
        className: 'bg-blue-500 w-4 h-4 rounded-full border-2 border-white',
        iconSize: [16, 16],
      })
    }).addTo(map)
      .bindPopup('Titik Awal');

    // Add route points and connect them
    const routeCoordinates = route.map(point => [point.lat, point.lng] as [number, number]);
    
    route.forEach((point) => {
      L.marker([point.lat, point.lng], {
        title: `Point ${point.order}`,
        icon: L.divIcon({
          className: 'bg-red-500 w-3 h-3 rounded-full border-2 border-white',
          iconSize: [12, 12],
        })
      }).addTo(map)
        .bindPopup(`Titik ${point.order}<br>Jarak: ${point.distance.toFixed(2)} km`);
    });

    // Draw route line
    L.polyline([[startPoint.lat, startPoint.lng], ...routeCoordinates], {
      color: '#4A90E2',
      weight: 2,
      opacity: 0.7
    }).addTo(map);

    // Fit bounds to show all points
    const bounds = L.latLngBounds([[startPoint.lat, startPoint.lng], ...routeCoordinates]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      // Cleanup on component unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [startPoint, route]);

  return (
    <div id={mapContainerId} className={styles.mapContainer} />
  );
}

// Example items array
const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
];

// Rendering items
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
