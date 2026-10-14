import React, { useState, useEffect, useRef } from 'react';
import type { Place } from '../../types';
import {
  haversineDistanceKm,
  formatDistance,
  calculateBearing,
  formatCoordinates,
  buildGeoUri,
  buildOfflineDirectionsSteps,
} from '../../utils/geoUtils';
import {
  X,
  MapPin,
  Compass,
  Copy,
  ExternalLink,
  Navigation,
  Clock,
  Phone,
  Check,
  AlertTriangle,
} from 'lucide-react';
import L from 'leaflet';

interface PlaceDirectionsModalProps {
  place: Place;
  referenceOrigin?: { name: string; lat: number; lng: number };
  onClose: () => void;
}

export const PlaceDirectionsModal: React.FC<PlaceDirectionsModalProps> = ({
  place,
  referenceOrigin,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const hasCoords = typeof place.lat === 'number' && typeof place.lng === 'number';

  // Calculate distance & bearing if origin coordinates are provided
  let distanceKm: number | null = null;
  let bearing: { degrees: number; cardinal: string } | null = null;
  let offlineSteps: string[] = [];

  if (hasCoords && referenceOrigin) {
    distanceKm = haversineDistanceKm(
      referenceOrigin.lat,
      referenceOrigin.lng,
      place.lat!,
      place.lng!
    );
    bearing = calculateBearing(
      referenceOrigin.lat,
      referenceOrigin.lng,
      place.lat!,
      place.lng!
    );
    offlineSteps = buildOfflineDirectionsSteps(
      referenceOrigin.name,
      place.name,
      distanceKm,
      bearing,
      place.directionsNotes || place.notes
    );
  }

  // Copy coordinates
  const handleCopyCoords = async () => {
    if (!hasCoords) return;
    try {
      await navigator.clipboard.writeText(`${place.lat}, ${place.lng}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  // Leaflet map initialization with graceful offline failure handling
  useEffect(() => {
    if (!hasCoords || !mapContainerRef.current) return;

    try {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [place.lat!, place.lng!],
        zoom: 14,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      })
        .on('tileerror', () => {
          setMapError(true);
        })
        .addTo(map);

      // Add pin marker
      const customIcon = L.divIcon({
        className: 'custom-place-pin',
        html: `
          <div style="
            background: #111111;
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([place.lat!, place.lng!], { icon: customIcon }).addTo(map);

      mapInstanceRef.current = map;
      setIsMapLoaded(true);
    } catch {
      setMapError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hasCoords, place.lat, place.lng]);

  const geoUri = hasCoords ? buildGeoUri(place.lat!, place.lng!, place.name) : '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="travelnest-card animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          padding: 0,
          margin: 0,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="label-micro">OFFLINE PLACE DETAILS & NAVIGATION</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>{place.name}</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Coordinates & Compass Card */}
          {hasCoords ? (
            <div
              style={{
                backgroundColor: '#F5F5F7',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={16} />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                    {formatCoordinates(place.lat!, place.lng!)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="btn btn-ghost"
                  style={{ padding: '3px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copied ? <Check size={13} color="#15803d" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {distanceKm !== null && bearing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#333333' }}>
                  <span>📍 <strong>{formatDistance(distanceKm)}</strong> away</span>
                  <span>🧭 Heading <strong>{bearing.cardinal} ({bearing.degrees}°)</strong></span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '10px 14px', backgroundColor: '#F5F5F7', borderRadius: '12px', fontSize: '0.84rem', color: 'var(--secondary)' }}>
              No GPS coordinates recorded for this place. You can still use the offline notes and address below.
            </div>
          )}

          {/* Map Preview with Offline Warning */}
          {hasCoords && (
            <div style={{ position: 'relative', height: '170px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
              {mapError && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    textAlign: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertTriangle size={20} color="#b45309" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Offline Map Notice</span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--secondary)' }}>
                    Map tiles require internet, but coordinates and directions below work 100% offline.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Address / Location Details */}
          {place.address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem' }}>
              <MapPin size={16} color="var(--secondary)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{place.address}</span>
            </div>
          )}

          {/* Opening Hours & Contact */}
          {(place.openingHours || place.contactInfo) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
              {place.openingHours && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--secondary)" />
                  <span>{place.openingHours}</span>
                </div>
              )}
              {place.contactInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} color="var(--secondary)" />
                  <span>{place.contactInfo}</span>
                </div>
              )}
            </div>
          )}

          {/* Offline Directions Steps */}
          {offlineSteps.length > 0 && (
            <div>
              <div className="label-micro" style={{ marginBottom: '8px' }}>
                OFFLINE DIRECTION STEPS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {offlineSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {place.notes && (
            <div>
              <div className="label-micro" style={{ marginBottom: '4px' }}>
                FIELD NOTES / TRANSIT TIPS
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#444444', lineHeight: 1.5 }}>
                {place.notes}
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Close
            </button>
            {hasCoords && (
              <a
                href={geoUri}
                className="btn btn-primary"
                style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <Navigation size={15} />
                <span>Open in Maps</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
