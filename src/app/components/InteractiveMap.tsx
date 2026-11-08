"use client";

import { useEffect } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Place } from "@/lib/places";

type Point = { lat: number; lng: number; label: string };

const userIcon = divIcon({
  className: "user-marker-icon",
  html: '<span class="user-marker-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const placeIcon = divIcon({
  className: "place-marker-icon",
  html: '<span class="place-marker-pin"><span></span></span>',
  iconSize: [30, 38],
  iconAnchor: [15, 36],
});

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 0.45 });
  }, [center, map]);
  return null;
}

export default function InteractiveMap({
  point,
  places,
  selected,
  onSelect,
}: {
  point: Point;
  places: Place[];
  selected: Place | null;
  onSelect: (place: Place) => void;
}) {
  const center: [number, number] = selected ? [selected.lat, selected.lng] : [point.lat, point.lng];

  return (
    <MapContainer center={[point.lat, point.lng]} zoom={15} scrollWheelZoom className="nearme-map">
      <Recenter center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Marker position={[point.lat, point.lng]} icon={userIcon}>
        <Popup>{point.label}</Popup>
      </Marker>
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={placeIcon}
          eventHandlers={{ click: () => onSelect(place) }}
        >
          <Popup>
            <strong>{place.name}</strong>
            <br />
            {place.category}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
