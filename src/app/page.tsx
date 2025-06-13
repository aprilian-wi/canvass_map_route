"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coordinate, RoutePoint, calculateRoute, parseCoordinatesFromCSV } from '@/lib/route-utils';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      Loading map...
    </div>
  ),
});

export default function RoutePlannerPage() {
  const [startPoint, setStartPoint] = useState<Coordinate>({ lat: -6.2088, lng: 106.8456 });
  const [destinations, setDestinations] = useState<RoutePoint[]>([]);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('input');

  const handleStartPointChange = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setStartPoint(prev => ({
      lat: field === 'lat' ? numValue : prev.lat,
      lng: field === 'lng' ? numValue : prev.lng,
    }));

    setError('');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const coords = parseCoordinatesFromCSV(text);
      if (!startPoint) {
        setError('Please set a starting point first');
        return;
      }
      const route = calculateRoute(startPoint, coords);
      setDestinations(route);
      setError('');
      setActiveTab('results');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSampleData = () => {
    try {
      // Sample coordinates around Jakarta
      const sampleDestinations = [
        { lat: -6.2088, lng: 106.8456 },
        { lat: -6.1751, lng: 106.8650 },
        { lat: -6.2382, lng: 106.8255 },
        { lat: -6.1935, lng: 106.8228 },
        { lat: -6.2241, lng: 106.8451 },
      ];

      const route = calculateRoute(startPoint, sampleDestinations);
      setDestinations(route);
      setError('');
      setActiveTab('results');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Route Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Input Data</TabsTrigger>
            <TabsTrigger value="results">Hasil Rute</TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-lat">Latitude Titik Awal</Label>
                  <Input
                    id="start-lat"
                    type="number"
                    step="any"
                    value={startPoint.lat}
                    placeholder="Enter latitude (e.g. -6.2088)"
                    onChange={(e) => handleStartPointChange('lat', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start-lng">Longitude Titik Awal</Label>
                  <Input
                    id="start-lng"
                    type="number"
                    step="any"
                    value={startPoint.lng}
                    placeholder="Enter longitude (e.g. 106.8456)"
                    onChange={(e) => handleStartPointChange('lng', e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="csv-upload">Upload Titik Tujuan (CSV)</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>Format CSV yang dibutuhkan:</p>
                    <ul className="list-disc pl-5">
                      <li>Setiap baris berisi: latitude,longitude (dipisahkan dengan koma)</li>
                      <li>Tidak perlu header/judul kolom</li>
                      <li>Contoh format:</li>
                    </ul>
                    <pre className="bg-gray-100 p-2 rounded">
                      -6.1751,106.8650{"\n"}
                      -6.2382,106.8255{"\n"}
                      -6.1935,106.8228
                    </pre>
                    <p>
                      <a 
                        href="/sample.csv" 
                        download 
                        className="text-blue-600 hover:underline"
                      >
                        Download contoh file CSV
                      </a>
                    </p>
                  </div>
                </div>

                <Button onClick={handleSampleData} className="w-full">
                  Gunakan Data Contoh
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results">
              {destinations.length > 0 && startPoint && (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        const csvContent = [
                          ['No', 'Latitude', 'Longitude', 'Jarak (km)'],
                          ...destinations.map(d => [
                            d.order.toString(),
                            d.lat.toFixed(6),
                            d.lng.toFixed(6),
                            d.distance.toFixed(3),
                          ]),
                        ]
                          .map(e => e.join(','))
                          .join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.setAttribute('href', url);
                        link.setAttribute('download', 'route.csv');
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="mb-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Download CSV
                    </button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Latitude</TableHead>
                        <TableHead>Longitude</TableHead>
                        <TableHead>Jarak (km)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {destinations.map((point) => (
                        <TableRow key={point.order}>
                          <TableCell>{point.order}</TableCell>
                          <TableCell>{point.lat.toFixed(4)}</TableCell>
                          <TableCell>{point.lng.toFixed(4)}</TableCell>
                          <TableCell>{point.distance.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="rounded-lg overflow-hidden border">
                    <Map startPoint={startPoint} route={destinations} />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
