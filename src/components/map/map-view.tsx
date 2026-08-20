"use client"
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

export default function MapView({ 
  markers = [] 
}: { 
  markers?: Array<{id: string, lat: number, lng: number, title: string}> 
}) {
  return (
    <div style={{ height: '100%', width: '100%', minHeight: '400px', zIndex: 0 }}>
      <MapContainer 
        center={[-2.5489, 118.0149]} 
        zoom={5} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={icon}>
            <Popup>
              {marker.title}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
