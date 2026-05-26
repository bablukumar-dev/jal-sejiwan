'use client';

import { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { Filter } from 'lucide-react';

// Module level cache to reduce redundant Geocoding API usage (safer & cheaper)
const geocodeCache: Record<string, google.maps.LatLngLiteral> = {
  'hsr layout': { lat: 12.9141, lng: 77.6413 },
  'indiranagar': { lat: 12.9719, lng: 77.6412 },
  'koramangala': { lat: 12.9279, lng: 77.6271 },
};

// Generates a stable fallback location around Bengaluru if geocoding fails, preventing overlapping or blanks
function getDeterministicCoords(text: string): google.maps.LatLngLiteral {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseLat = 12.9716;
  const baseLng = 77.5946;
  const latOffset = ((hash & 0xFF) / 255) * 0.05 - 0.025;
  const lngOffset = (((hash >> 8) & 0xFF) / 255) * 0.05 - 0.025;
  return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
}

// Sub-component to render the polyline connecting customer route markers sequentially
function RoutePolyline({ points }: { points: google.maps.LatLngLiteral[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length < 2) return;

    const polyline = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: '#2563EB', // Blue-600
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });

    polyline.setMap(map);

    return () => {
      polyline.setMap(null);
    };
  }, [map, points]);

  return null;
}

// Marker component with an anchor-based Google Maps InfoWindow showing drop details and quick record action buttons
function CustomMarkerWithInfoWindow({ 
  customer, 
  delivery, 
  position, 
  onRecord, 
  onSkip 
}: { 
  customer: any; 
  delivery: any; 
  position: google.maps.LatLngLiteral; 
  onRecord: (customerId: number) => void; 
  onSkip: (customerId: number) => void; 
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  let pinBg = '#2563EB'; // Pending blue
  let glyphText = '💧';

  if (delivery && delivery.status === 'Delivered') {
    pinBg = '#10B981'; // Green for Completed
    glyphText = '✅';
  } else if (delivery && delivery.status === 'Skipped') {
    pinBg = '#F97316'; // Orange for Skipped
    glyphText = '⚠️';
  } else if (delivery && delivery.priority === 'High') {
    pinBg = '#EF4444'; // Red for High Priority
    glyphText = '🔥';
  }

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => setOpen(true)}
      >
        <Pin background={pinBg} glyph={glyphText} borderColor="#FFFFFF" />
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-1 min-w-[180px] text-slate-800 font-sans">
            <h3 className="font-bold text-xs text-slate-900 mb-0.5">{customer.name}</h3>
            <p className="text-[10px] text-slate-500 mb-1.5 truncate">{customer.address}</p>
            
            <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded mb-2 text-[9px] border border-slate-100">
              <div>
                <span className="text-slate-400 block uppercase font-mono">Deliver</span>
                <strong className="text-blue-700 text-xs">{customer.defaultQty} Cans</strong>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-mono">Balance</span>
                <strong className="text-slate-700 text-xs">{customer.emptyBalance} Cans</strong>
              </div>
            </div>

            <div className="flex gap-1">
              {(!delivery || delivery.status === 'Pending') ? (
                <>
                  <button 
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSkip(customer.id);
                    }}
                    className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-1 px-1 rounded text-[9px] active:scale-95 transition-transform"
                  >
                    Skip
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onRecord(customer.id);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-1 rounded text-[9px] active:scale-95 transition-transform"
                  >
                    Record
                  </button>
                </>
              ) : (
                <div className="flex-1 bg-slate-100 text-slate-600 text-[10px] py-1 text-center rounded font-semibold border border-slate-200">
                  {delivery.status}
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
        defaultCenter={{ lat: 12.9716, lng: 77.5946 }}
        zoom={zoom}
        onZoomChanged={(e) => setZoom(e.detail.zoom)}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {customers.map(c => {
          const d = deliveries.find(del => del.customerId === c.id);
          const pos = coords[c.id];
          if (!pos) return null;
          return (
            <CustomMarkerWithInfoWindow
              key={c.id}
              customer={c}
              delivery={d}
              position={pos}
              onRecord={onRecord}
              onSkip={onSkip}
            />
          );
        })}
        
        {polylinePoints.length >= 2 && <RoutePolyline points={polylinePoints} />}
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
  const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const displayCustomers = useMemo(() => {
    if (!showPendingOnly) return customers;
    return customers.filter(c => {
      const d = deliveries.find(del => del.customerId === c.id && del.date === today);
      return !d || d.status === 'Pending';
    });
  }, [customers, deliveries, showPendingOnly, today]);

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
      <APIProvider apiKey={API_KEY} version="weekly">
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
        className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 shadow-lg px-3.5 py-2.5 rounded-2xl text-[11px] font-bold tracking-wider transition-all border outline-none active:scale-95 ${
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
