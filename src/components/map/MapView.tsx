import React, { useEffect, useRef, useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../../context/AppContext';
import type { Place } from '../../types';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  X,
  ExternalLink,
  Plus,
  ChevronLeft,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

interface MapViewProps {
  tripId?: string;
}

export const MapView: React.FC<MapViewProps> = ({ tripId }) => {
  const { isOnline, openQuickAdd, setTripSubTab } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const places = useLiveQuery(
    () => (tripId ? db.places.where('tripId').equals(tripId).toArray() : db.places.toArray()),
    [tripId]
  );

  const placesWithCoords = (places || []).filter((p) => p.lat && p.lng);
  const filteredPlaces = placesWithCoords.filter((p) => {
    if (filterCategory === 'all') return true;
    return p.category === filterCategory;
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    let centerLat = 35.6762;
    let centerLng = 139.6503;
    let zoomLevel = 12;

    if (filteredPlaces.length > 0) {
      centerLat = filteredPlaces[0].lat!;
      centerLng = filteredPlaces[0].lng!;
    }

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: zoomLevel,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    if (filteredPlaces.length === 0) return;

    const bounds = L.latLngBounds([]);

    filteredPlaces.forEach((place) => {
      if (!place.lat || !place.lng) return;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="
            background: #111111;
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([place.lat, place.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedPlace(place);
      });

      markersLayerRef.current?.addLayer(marker);
      bounds.extend([place.lat, place.lng]);
    });

    if (filteredPlaces.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [filteredPlaces]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', minHeight: '520px' }}>
      {/* Top Navigation if inside a Trip */}
      {tripId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setTripSubTab('overview')}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
            title="Back to Overview"
            aria-label="Back to Overview"
          >
            <ChevronLeft size={18} strokeWidth={2.4} />
          </button>
          <span className="label-micro">
            RETURN TO TRIP OVERVIEW
          </span>
        </div>
      )}

      {/* Category Segmented Control */}
      <div className="cupertino-segmented" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {['all', 'attraction', 'food', 'stay', 'transit'].map((cat) => {
          const count = cat === 'all'
            ? placesWithCoords.length
            : placesWithCoords.filter((p) => p.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`cupertino-segment-item ${filterCategory === cat ? 'active' : ''}`}
              style={{ textTransform: 'capitalize', fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>{cat === 'all' ? 'All Pins' : cat}</span>
              <span className="chip-count-bubble">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Offline Leaflet Notice */}
      {!isOnline && (
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: 'var(--surface-neutral-2)',
            color: 'var(--neutral-carbon)',
            borderRadius: '9999px',
            fontSize: '0.76rem',
            fontWeight: 500,
            border: '1px solid var(--border)',
          }}
        >
          📱 Offline Mode: Displaying locally cached tiles & coordinates.
        </div>
      )}

      {/* Map Surface */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: '440px',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '440px' }} />

        {/* Selected Place Overlay Card */}
        {selectedPlace && (
          <div
            className="travelnest-card"
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              padding: '16px 18px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: 'var(--shadow-lg)',
              background: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span
                  style={{
                    backgroundColor: 'var(--surface-neutral-2)',
                    color: 'var(--primary)',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    border: '1px solid var(--border)',
                  }}
                >
                  {selectedPlace.category}
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '4px 0 0', color: 'var(--primary)' }}>
                  {selectedPlace.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {selectedPlace.address && (
              <div style={{ fontSize: '0.78rem', color: 'var(--neutral-carbon)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} />
                <span>{selectedPlace.address}</span>
              </div>
            )}

            {selectedPlace.notes && (
              <p style={{ fontSize: '0.8rem', color: 'var(--primary)', margin: 0, lineHeight: 1.4 }}>
                {selectedPlace.notes}
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {selectedPlace.lat && selectedPlace.lng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Navigation size={13} />
                  <span>Navigate</span>
                </a>
              )}
              {selectedPlace.sourceUrl && (
                <a
                  href={selectedPlace.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={13} />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <FloatingActionButton
        onClick={() => openQuickAdd(tripId)}
        icon={<Plus size={26} strokeWidth={2.4} />}
        label="Add Spot"
      />
    </div>
  );
};
