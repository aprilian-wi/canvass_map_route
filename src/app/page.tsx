"use client";

import { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStartPoint({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
    }
  }, []);

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
        { 
          lat: -6.2088, 
          lng: 106.8456,
          name: "Toyib Travel",
          address: "Jl. Tole Iskandar No.9, Tirtajaya, Kec. Sukmajaya"
        },
        { 
          lat: -6.1751, 
          lng: 106.8650,
          name: "Al Hijaz Travel",
          address: "Jl. Margonda Raya No.12, Depok"
        },
        { 
          lat: -6.2382, 
          lng: 106.8255,
          name: "Safina Tour",
          address: "Jl. Juanda No.50, Depok"
        },
        { 
          lat: -6.1935, 
          lng: 106.8228,
          name: "Andalusia Travel",
          address: "Jl. Raya Bogor Km.29, Jakarta Timur"
        },
        { 
          lat: -6.2241, 
          lng: 106.8451,
          name: "Dian Travel",
          address: "Jl. Cinere Raya No.15, Depok"
        }
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
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-2">Mendapatkan lokasi Anda...</span>
                </div>
              ) : (
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
                      <li>Setiap baris berisi: latitude,longitude,nama,alamat (dipisahkan dengan koma)</li>
                      <li>Tidak perlu header/judul kolom</li>
                      <li>Contoh format:</li>
                    </ul>
                    <pre className="bg-gray-100 p-2 rounded">
                      -6.1751,106.8650,Toyib Travel,Jl. Tole Iskandar No.9{"\n"}
                      -6.2382,106.8255,Al Hijaz Travel,Jl. Margonda Raya No.12{"\n"}
                      -6.1935,106.8228,Safina Tour,Jl. Juanda No.50
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
              )}
            </TabsContent>

            <TabsContent value="results">
              {destinations.length > 0 && startPoint && (
                <div className="space-y-6">
                  <div className="flex justify-end space-x-2">
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
                        <TableHead>Nama & Alamat</TableHead>
                        <TableHead>Latitude</TableHead>
                        <TableHead>Longitude</TableHead>
                        <TableHead>Jarak (km)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {destinations.map((point) => (
                        <TableRow key={point.order}>
                          <TableCell>{point.order}</TableCell>
                          <TableCell>
                            {point.name && (
                              <div className="font-medium">{point.name}</div>
                            )}
                            {point.address && (
                              <div className="text-sm text-gray-500">{point.address}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{point.lat.toFixed(6)}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${point.lat.toFixed(6)},${point.lng.toFixed(6)}`);
                                  alert('Koordinat telah disalin ke clipboard');
                                }}
                                className="rounded bg-gray-100 p-1 hover:bg-gray-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                </svg>
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{point.lng.toFixed(6)}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${point.lat.toFixed(6)},${point.lng.toFixed(6)}`);
                                  alert('Koordinat telah disalin ke clipboard');
                                }}
                                className="rounded bg-gray-100 p-1 hover:bg-gray-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                </svg>
                              </button>
                            </div>
                          </TableCell>
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
