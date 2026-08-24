"use client"

import React from "react"
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, ZoomControl } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import Link from "next/link"

export interface StationFeature {
  id: string
  station_code: string
  name: string
  province: string
  city: string
  latitude: number
  longitude: number
  status: string
  total_samplings?: number
  total_events?: number
  active_events_count?: number
  latest_sampling_date?: string | null
  latest_chlorophyll_a?: number | null
  latest_temperature?: number | null
}

export interface BloomEventFeature {
  id: string
  event_code: string
  event_type: string
  event_start_date: string
  event_end_date: string | null
  is_active: boolean
  severity_level: string
  alert_status: string
  description?: string | null
  station_id: string
  station_code: string
  station_name: string
  city: string
  province: string
  latitude: number
  longitude: number
  associated_species?: {
    scientific_name: string
    common_name: string | null
    organism_category: string
    is_toxic: boolean
    density_value: number
    density_unit: string
  }[]
  avg_chlorophyll_a?: number | null
  avg_temperature?: number | null
}

// Custom DivIcons for Leaflet
function createStationIcon() {
  return L.divIcon({
    className: "custom-map-marker station-marker",
    html: `
      <div style="
        background: linear-gradient(135deg, #00B4D8, #0077B6);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="5" r="3"></circle>
          <line x1="12" y1="22" x2="12" y2="8"></line>
          <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

function createHabsIcon(alertStatus: string) {
  const isUrgent = alertStatus === "Darurat" || alertStatus === "Siaga"
  const color = alertStatus === "Darurat" ? "#D90429" : alertStatus === "Siaga" ? "#F77F00" : "#FCBF49"

  return L.divIcon({
    className: "custom-map-marker habs-marker",
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        ${isUrgent ? `
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: ${color};
            opacity: 0.5;
            animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          "></div>
        ` : ""}
        <div style="
          position: relative;
          background: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2.5px solid #FFFFFF;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4"></path>
            <path d="m4.93 4.93 2.83 2.83"></path>
            <path d="M2 12h4"></path>
            <path d="m4.93 19.07 2.83-2.83"></path>
            <path d="M12 22v-4"></path>
            <path d="m19.07 19.07-2.83-2.83"></path>
            <path d="M22 12h-4"></path>
            <path d="m19.07 4.93-2.83 2.83"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

function createJellyfishIcon(alertStatus: string) {
  const color = alertStatus === "Darurat" ? "#7209B7" : alertStatus === "Siaga" ? "#9D4EDD" : "#B5179E"

  return L.divIcon({
    className: "custom-map-marker jellyfish-marker",
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, #560BAD);
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8c0 3.3 2 6 5 7.4V20a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.6c3-1.4 5-4.1 5-7.4a8 8 0 0 0-8-8z"></path>
          <path d="M9 13v6"></path>
          <path d="M15 13v6"></path>
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  })
}

export default function MapView({
  stations = [],
  habsEvents = [],
  jellyfishEvents = [],
  showStations = true,
  showHabs = true,
  showJellyfish = true,
  selectedLocation,
}: {
  stations?: StationFeature[]
  habsEvents?: BloomEventFeature[]
  jellyfishEvents?: BloomEventFeature[]
  showStations?: boolean
  showHabs?: boolean
  showJellyfish?: boolean
  selectedLocation?: [number, number] | null
}) {
  const stationIcon = React.useMemo(() => createStationIcon(), [])

  return (
    <div style={{ height: "100%", width: "100%", minHeight: "450px", zIndex: 0, position: "relative" }}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0.2; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .leaflet-popup-content {
          margin: 10px 12px;
          font-family: inherit;
        }
      `}</style>
      <MapContainer
        center={selectedLocation || [-2.5489, 118.0149]}
        zoom={5}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* LAYER 1: STASIUN MONITORING */}
        {showStations &&
          stations.map((st) => (
            <Marker
              key={`st-${st.id}`}
              position={[st.latitude, st.longitude]}
              icon={stationIcon}
            >
              <Popup>
                <div className="space-y-2 text-xs min-w-[210px] text-gray-900">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-semibold text-[10px]">
                      Stasiun Monitoring
                    </span>
                    <span className="font-mono font-bold text-sky-800 text-[11px]">{st.station_code}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-tight">{st.name}</h4>
                    <p className="text-[11px] text-gray-500">{st.city}, {st.province}</p>
                  </div>

                  <div className="p-2 rounded bg-gray-50 border border-gray-100 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-semibold text-emerald-700 capitalize">{st.status}</span>
                    </div>
                    {st.latest_chlorophyll_a !== null && st.latest_chlorophyll_a !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Klorofil-a:</span>
                        <span className="font-semibold">{st.latest_chlorophyll_a} µg/L</span>
                      </div>
                    )}
                    {st.latest_temperature !== null && st.latest_temperature !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Suhu Laut:</span>
                        <span className="font-semibold">{st.latest_temperature} °C</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      {st.total_events ? `${st.total_events} kejadian tercatat` : "Belum ada kejadian"}
                    </span>
                    <Link
                      href={`/monitoring/stations/${st.station_code || st.id}`}
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                    >
                      Buka Detail &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* LAYER 2: KEJADIAN HABS */}
        {showHabs &&
          habsEvents.map((ev) => (
            <Marker
              key={`habs-${ev.id}`}
              position={[ev.latitude, ev.longitude]}
              icon={createHabsIcon(ev.alert_status)}
            >
              <Popup>
                <div className="space-y-2 text-xs min-w-[230px] text-gray-900">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold text-[10px]">
                      Harmful Algal Blooms
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        ev.alert_status === "Darurat"
                          ? "bg-rose-600"
                          : ev.alert_status === "Siaga"
                          ? "bg-amber-500"
                          : "bg-yellow-500 text-black"
                      }`}
                    >
                      {ev.alert_status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-tight">
                      {ev.event_code} &bull; {ev.station_name}
                    </h4>
                    <p className="text-[11px] text-gray-500">Mulai: {ev.event_start_date}</p>
                  </div>

                  {ev.description && (
                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 p-1.5 rounded border border-gray-100">
                      {ev.description}
                    </p>
                  )}

                  {ev.associated_species && ev.associated_species.length > 0 && (
                    <div className="text-[11px] text-gray-700">
                      <span className="text-gray-400 block text-[10px]">Spesies Terkait:</span>
                      <span className="italic font-medium text-rose-800">
                        {ev.associated_species.slice(0, 2).map((s) => s.scientific_name).join(", ")}
                      </span>
                    </div>
                  )}

                  <div className="pt-1 border-t flex justify-end">
                    <Link
                      href="/events/habs"
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                    >
                      Lihat Log Kejadian &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* LAYER 3: BLOOMING UBUR-UBUR */}
        {showJellyfish &&
          jellyfishEvents.map((ev) => (
            <Marker
              key={`jelly-${ev.id}`}
              position={[ev.latitude, ev.longitude]}
              icon={createJellyfishIcon(ev.alert_status)}
            >
              <Popup>
                <div className="space-y-2 text-xs min-w-[230px] text-gray-900">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold text-[10px]">
                      Jellyfish Bloom
                    </span>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold text-[10px]">
                      {ev.alert_status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-tight">
                      {ev.event_code} &bull; {ev.station_name}
                    </h4>
                    <p className="text-[11px] text-gray-500">{ev.city}, {ev.province}</p>
                  </div>

                  {ev.description && (
                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 p-1.5 rounded border border-gray-100">
                      {ev.description}
                    </p>
                  )}

                  <div className="pt-1 border-t flex justify-end">
                    <Link
                      href="/events/habs"
                      className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 hover:underline"
                    >
                      Lihat Log Kejadian &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}
