'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useAdvancedMarkerRef, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Filter, Calendar, MapPin, Navigation } from 'lucide-react';

// Module level NCR (Gurgaon) cache for default mock addresses to guarantee instantaneous loading
const geocodeCache: Record<string, google.maps.LatLngLiteral> = {
  'sector 45, green park': { lat: 28.4411, lng: 77.0722 },
  'plot 12, industrial area ph-1': { lat: 28.5033, lng: 77.0851 },
  'h-block, sarita vihar': { lat: 28.5303, lng: 77.2941 },
  'sector 18, metro road': { lat: 28.4812, lng: 77.0818 },
  'main market, shop 42': { lat: 28.4611, lng: 77.0422 },
  'hsr layout': { lat: 12.9141, lng: 77.6413 },
  'indiranagar': { lat: 12.9719, lng: 77.6412 },
  'koramangala': { lat: 12.9279, lng: 77.6271 },
};

// Generates a stable fallback location around Gurgaon if geocoding fails, preventing overlapping or blanks
function getDeterministicCoords(text: string): google.maps.LatLngLiteral {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseLat = 28.4595;
  const baseLng = 77.0266;
  const latOffset = ((hash & 0xFF) / 255) * 0.05 - 0.025;
  const lngOffset = (((hash >> 8) & 0xFF) / 255) * 0.05 - 0.025;
  return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
}

// Sub-component to compute and display actual driving paths connecting markers sequentially
function DrivingRouteDisplay({ points }: { points: google.maps.LatLngLiteral[] }) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [stats, setStats] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    if (!map || points.length < 2) {
      Promise.resolve().then(() => {
        setStats(prev => prev === null ? null : null);
      });
      return;
    }

    if (!routesLib) {
      // Fallback: draw straight direct lines
      const polyline = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: '#3B82F6', // Blue-550
        strokeOpacity: 0.75,
        strokeWeight: 4,
      });
      polyline.setMap(map);
      polylinesRef.current = [polyline];
      Promise.resolve().then(() => {
        setStats(prev => prev === null ? null : null);
      });
      return;
    }

    let active = true;
    const computedPolylines: google.maps.Polyline[] = [];
    let totalDistanceMeters = 0;
    let totalDurationMillis = 0;

    const computeAllSegments = async () => {
      for (let i = 0; i < points.length - 1; i++) {
        if (!active) return;
        try {
          const res = await routesLib.Route.computeRoutes({
            origin: points[i],
            destination: points[i + 1],
            travelMode: 'DRIVING',
            fields: ['path', 'distanceMeters', 'durationMillis'],
          });

          if (res.routes?.[0]) {
            const legPolylines = res.routes[0].createPolylines();
            legPolylines.forEach(p => {
              p.setOptions({
                strokeColor: '#2563EB', // Blue-600 driving line
                strokeOpacity: 0.85,
                strokeWeight: 5,
              });
              p.setMap(map);
              computedPolylines.push(p);
            });
            totalDistanceMeters += Number(res.routes[0].distanceMeters) || 0;
            const duration = String(res.routes[0].durationMillis || '0');
            totalDurationMillis += parseInt(duration, 10) || 0;
          } else {
            // Draw segment fallback direct line
            const fallbackPolyline = new google.maps.Polyline({
              path: [points[i], points[i + 1]],
              geodesic: true,
              strokeColor: '#3B82F6',
              strokeOpacity: 0.8,
              strokeWeight: 4,
            });
            fallbackPolyline.setMap(map);
            computedPolylines.push(fallbackPolyline);
          }
          // Brief sleep to avoid hitting API rate limits
          await new Promise(r => setTimeout(r, 60));
        } catch (err) {
          console.error("Driving route segment compute error:", err);
          // Draw segment fallback direct line
          const fallbackPolyline = new google.maps.Polyline({
            path: [points[i], points[i + 1]],
            geodesic: true,
            strokeColor: '#3B82F6',
            strokeOpacity: 0.7,
            strokeWeight: 4,
          });
          fallbackPolyline.setMap(map);
          computedPolylines.push(fallbackPolyline);
        }
      }

      if (active) {
        polylinesRef.current = computedPolylines;
        if (totalDistanceMeters > 0) {
          const distanceText = (totalDistanceMeters / 1000).toFixed(1) + ' km';
          const durationMinutes = Math.round(totalDurationMillis / 60000);
          const durationText = durationMinutes >= 60 
            ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
            : `${durationMinutes} mins`;
          setStats({ distance: distanceText, duration: durationText });
        } else {
          setStats(prev => prev === null ? null : null);
        }
      }
    };

    computeAllSegments();

    return () => {
      active = false;
      computedPolylines.forEach(p => p.setMap(null));
    };
  }, [map, routesLib, points]);

  if (!stats) return null;

  return (
    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur shadow-md px-3.5 py-2.5 rounded-2xl text-[10px] font-bold border border-slate-100 text-slate-800 flex flex-col gap-1 z-10 transition-all">
      <div className="text-slate-400 uppercase tracking-widest text-[8px] flex items-center gap-1">
        <Navigation className="w-2.5 h-2.5 text-blue-600 animate-pulse" /> Driving Estimation
      </div>
      <div className="flex gap-2.5 text-[11px] font-extrabold text-blue-900 leading-none">
        <span>📏 {stats.distance}</span>
        <span className="text-slate-300">|</span>
        <span>⏱️ {stats.duration}</span>
      </div>
    </div>
  );
}

// Marker component with custom, CSS-sized HTML element to show sequence numbers clearly and avoid blank rendering
function CustomMarkerWithInfoWindow({ 
  customer, 
  delivery, 
  position, 
  index,
  onRecord, 
  onSkip 
}: { 
  customer: any; 
  delivery: any; 
  position: google.maps.LatLngLiteral; 
  index: number;
  onRecord: (customerId: number) => void; 
  onSkip: (customerId: number) => void; 
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  let pinBg = 'bg-blue-600 hover:bg-blue-700'; // Pending standard blue
  let glowColor = 'shadow-blue-200';

  if (delivery && delivery.status === 'Delivered') {
    pinBg = 'bg-emerald-500 hover:bg-emerald-600'; // Completed emerald
    glowColor = 'shadow-emerald-100';
  } else if (delivery && delivery.status === 'Skipped') {
    pinBg = 'bg-orange-500 hover:bg-orange-600'; // Skipped orange
    glowColor = 'shadow-orange-100';
  } else if (delivery && delivery.priority === 'High') {
    pinBg = 'bg-rose-600 hover:bg-rose-700'; // High priority red
    glowColor = 'shadow-rose-200';
  }

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => setOpen(true)}
      >
        <div 
          style={{ width: '40px', height: '44px' }} 
          className="relative flex flex-col items-center justify-center cursor-pointer group"
        >
          {/* Custom Pin Design */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-[13px] shadow-lg border-2 border-white transition-all duration-150 active:scale-90 ${pinBg} ${glowColor}`}>
            {index + 1}
          </div>
          {/* Beak / Stem of Pin */}
          <div className={`w-2 h-2 -mt-1 rotate-45 border-r-2 border-b-2 border-white ${pinBg}`} />
          
          {/* Accessible hover tooltip label */}
          <span className="absolute top-11 bg-slate-900/90 text-[9px] text-white px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-150 z-20">
            {customer.name}
          </span>
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-1 min-w-[200px] text-slate-800 font-sans">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200 shrink-0">
                Stop #{index + 1}
              </span>
              <h3 className="font-extrabold text-xs text-slate-900 truncate leading-tight">{customer.name}</h3>
            </div>
            <p className="text-[10px] text-slate-500 mb-2 truncate flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {customer.address}
            </p>
            
            <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-xl mb-2.5 text-[9px] border border-slate-100">
              <div>
                <span className="text-slate-400 block uppercase font-mono text-[8px] tracking-wide">Drop target</span>
                <strong className="text-blue-700 text-xs font-black">{customer.defaultQty} Cans</strong>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-mono text-[8px] tracking-wide">Empty bal.</span>
                <strong className="text-slate-700 text-xs font-black">{customer.emptyBalance} Cans</strong>
              </div>
            </div>

            <div className="flex gap-1.5">
              {(!delivery || delivery.status === 'Pending') ? (
                <>
                  <button 
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSkip(customer.id);
                    }}
                    className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-1.5 px-1 rounded-lg text-[10px] active:scale-95 transition-transform border border-orange-200"
                  >
                    Skip Stop
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onRecord(customer.id);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-1 rounded-lg text-[10px] active:scale-95 transition-transform shadow-md shadow-blue-100"
                  >
                    Record Drop
                  </button>
                </>
              ) : (
                <div className={`flex-1 text-[10px] py-1.5 text-center rounded-lg font-bold border ${
                  delivery.status === 'Delivered' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-orange-50 border-orange-200 text-orange-800'
                }`}>
                  {delivery.status === 'Delivered' ? '✅ Drop Completed' : '⚠️ Stop Skipped'}
                </div>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

// Inner Maps container that performs geocoding and updates coordinate state
function GeocodedMapContent({ 
  customers, 
  deliveries, 
  onRecord, 
  onSkip,
  zoom,
  setZoom
}: { 
  customers: any[]; 
  deliveries: any[]; 
  onRecord: (customerId: number) => void; 
  onSkip: (customerId: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}) {
  const map = useMap();
  const [coords, setCoords] = useState<Record<number, google.maps.LatLngLiteral>>({});

  useEffect(() => {
    if (!map) return;

    const geocoder = new google.maps.Geocoder();
    let isCancelled = false;

    const geocodeAll = async () => {
      const newCoords: Record<number, google.maps.LatLngLiteral> = {};
      
      for (const customer of customers) {
        if (isCancelled) return;
        const cacheKey = customer.address ? customer.address.trim().toLowerCase() : '';
        
        if (cacheKey && geocodeCache[cacheKey]) {
          newCoords[customer.id] = geocodeCache[cacheKey];
          continue;
        }

        // Check if we can geocode this address
        if (customer.address) {
          try {
            await new Promise<void>((resolve, reject) => {
              geocoder.geocode({ address: customer.address }, (results, status) => {
                if (status === 'OK' && results?.[0]?.geometry?.location) {
                  const loc = {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                  };
                  geocodeCache[cacheKey] = loc;
                  newCoords[customer.id] = loc;
                  resolve();
                } else {
                  reject(new Error(`Geocode status other than OK: ${status}`));
                }
              });
            });
            // Small throttle to avoid hitting query limits
            await new Promise(r => setTimeout(r, 60));
          } catch (e) {
            // Safe deterministic mapping in case API quota limit or geocoding fails
            newCoords[customer.id] = getDeterministicCoords(customer.name + " " + customer.address);
          }
        } else {
          newCoords[customer.id] = getDeterministicCoords(customer.name);
        }
      }

      if (!isCancelled) {
        setCoords(newCoords);
        const coordValues = Object.values(newCoords);
        if (coordValues.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          coordValues.forEach(pt => bounds.extend(pt));
          map.fitBounds(bounds);
          if (coordValues.length === 1) {
            map.setZoom(15);
          }
        }
      }
    };

    geocodeAll();

    return () => {
      isCancelled = true;
    };
  }, [map, customers]);

  // Extract points in sequencing order to draw the connecting polyline
  const polylinePoints = useMemo(() => {
    return customers
      .map(c => coords[c.id])
      .filter((pos): pos is google.maps.LatLngLiteral => !!pos);
  }, [customers, coords]);

  return (
    <>
      <Map
        id="staff_route_map"
        defaultCenter={{ lat: 28.4595, lng: 77.0266 }}
        zoom={zoom}
        onZoomChanged={(e) => setZoom(e.detail.zoom)}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        disableDefaultUI={true}
        zoomControl={true}
      >
        {customers.map((c, idx) => {
          const d = deliveries.find(del => del.customerId === c.id);
          const pos = coords[c.id];
          if (!pos) return null;
          return (
            <CustomMarkerWithInfoWindow
              key={c.id}
              customer={c}
              delivery={d}
              position={pos}
              index={idx}
              onRecord={onRecord}
              onSkip={onSkip}
            />
          );
        })}
        
        {polylinePoints.length >= 2 && <DrivingRouteDisplay points={polylinePoints} />}
      </Map>
    </>
  );
}

export default function RouteMap({
  customers,
  deliveries,
  onRecord,
  onSkip,
  zoom,
  setZoom
}: {
  customers: any[];
  deliveries: any[];
  onRecord: (customerId: number) => void;
  onSkip: (customerId: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}) {
  const [apiKey, setApiKey] = useState<string>(() => {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
  });
  const [isLoadingKey, setIsLoadingKey] = useState<boolean>(!apiKey);
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchKey = async () => {
      try {
        const res = await fetch('/api/maps-key');
        const data = await res.json();
        if (active && data.apiKey) {
          setApiKey(data.apiKey);
        }
      } catch (err) {
        console.error('Error loading Google Maps API Key:', err);
      } finally {
        if (active) {
          setIsLoadingKey(false);
        }
      }
    };
    fetchKey();
    return () => {
      active = false;
    };
  }, []);

  const hasValidKey = Boolean(apiKey) && apiKey !== 'YOUR_API_KEY';

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const displayCustomers = useMemo(() => {
    if (!showPendingOnly) return customers;
    return customers.filter(c => {
      const d = deliveries.find(del => del.customerId === c.id && del.date === today);
      return !d || d.status === 'Pending';
    });
  }, [customers, deliveries, showPendingOnly, today]);

  if (isLoadingKey) {
    return (
      <div className="bg-slate-900 text-white rounded-3xl h-full w-full p-6 flex flex-col justify-center items-center text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[11px] text-slate-300">Checking credentials...</p>
      </div>
    );
  }

  if (!hasValidKey) {
    return (
      <div className="bg-slate-900 text-white rounded-3xl h-full w-full p-6 flex flex-col justify-center items-center text-center">
        <div className="bg-amber-500/20 text-amber-500 p-3 rounded-full mb-3">
          🔑
        </div>
        <h3 className="font-bold text-sm mb-1">Google Maps API Key Needed</h3>
        <p className="text-[11px] text-slate-300 max-w-xs mb-3">
          To display customer locations on an interactive live map, configure your Google Maps API key in secrets.
        </p>
        <div className="text-[10px] bg-slate-800 p-2.5 rounded-xl text-left text-slate-400 leading-normal max-w-sm">
          <strong>Setup:</strong> Settings (⚙️ Top Right) &rarr; Secrets &rarr; Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> &rarr; save key & press Enter. The app compiles instantly.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={apiKey} version="weekly">
        <GeocodedMapContent
          customers={displayCustomers}
          deliveries={deliveries}
          onRecord={onRecord}
          onSkip={onSkip}
          zoom={zoom}
          setZoom={setZoom}
        />
      </APIProvider>
      <button
        type="button"
        onClick={() => setShowPendingOnly(!showPendingOnly)}
        className={`absolute bottom-3 left-3 z-10 flex items-center gap-1.5 shadow-lg px-3.5 py-2.5 rounded-2xl text-[11px] font-bold tracking-wider transition-all border outline-none active:scale-95 ${
          showPendingOnly 
            ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700' 
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
      >
        <Filter className={`w-3.5 h-3.5 ${showPendingOnly ? 'animate-pulse' : ''}`} />
        {showPendingOnly ? 'PENDING ONLY' : 'ALL CUSTOMERS'}
      </button>
    </div>
  );
}
