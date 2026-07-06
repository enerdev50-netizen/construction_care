import React, { useEffect, useRef } from 'react';
import './MapWidget.css';

interface MapMarker {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface MapWidgetProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  title?: string;
  subtitle?: string;
}

declare global {
  interface Window {
    L: any;
  }
}

const MapWidget: React.FC<MapWidgetProps> = ({
  markers,
  center = [6.1628, 1.3283], // Par défaut Lomé, Togo
  zoom = 12,
  title = 'Géolocalisation des chantiers',
  subtitle = 'Suivi cartographique des chantiers actifs',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // S'assurer que Leaflet (L) est chargé et que le conteneur existe
    if (!window.L || !mapContainerRef.current) return;

    // Éviter de réinitialiser la carte si elle existe déjà
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    try {
      // 1. Initialisation de la carte
      const map = window.L.map(mapContainerRef.current).setView(center, zoom);
      mapInstanceRef.current = map;

      // 2. Ajouter la couche de tuiles Dark Matter (très esthétique pour le thème sombre)
      window.L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      ).addTo(map);

      // 3. Ajouter les marqueurs pour chaque chantier
      markers.forEach((marker) => {
        if (!marker.latitude || !marker.longitude) return;

        // Définir une couleur selon le statut
        let markerColor = '#FFB300'; // Amber par défaut
        if (marker.status === 'TERMINE') markerColor = '#10B981'; // Vert
        if (marker.status === 'SUSPENDU') markerColor = '#EF4444'; // Rouge

        // Créer un marqueur personnalisé en SVG pour ne pas dépendre des images par défaut de Leaflet
        const customIcon = window.L.divIcon({
          html: `<div style="
            width: 24px;
            height: 24px;
            background-color: ${markerColor}22;
            border: 2px solid ${markerColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px ${markerColor}88;
          "><div style="
            width: 8px;
            height: 8px;
            background-color: ${markerColor};
            border-radius: 50%;
          "></div></div>`,
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const mapMarker = window.L.marker([marker.latitude, marker.longitude], {
          icon: customIcon,
        }).addTo(map);

        // Ajouter une infobulle popup
        mapMarker.bindPopup(`
          <div style="color: var(--text-primary); font-family: var(--font-body);">
            <strong style="font-family: var(--font-title); font-size: 14px;">${marker.name}</strong><br/>
            <span style="font-size: 12px; color: var(--text-secondary);">${marker.address || ''}</span><br/>
            <span style="font-size: 11px; font-weight: bold; color: ${markerColor}; text-transform: uppercase;">
              ${marker.status.replace('_', ' ')}
            </span>
          </div>
        `);
      });
    } catch (err) {
      console.error('Erreur d\'initialisation de la carte Leaflet', err);
    }

    // Nettoyage au démontage
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markers, center, zoom]);

  return (
    <div className="map-widget-container glass-panel animate-fade-in" style={{ padding: '20px' }}>
      <div className="map-header">
        <div>
          <h3 className="map-title">{title}</h3>
          <p className="map-subtitle">{subtitle}</p>
        </div>
      </div>
      <div ref={mapContainerRef} className="map-element" />
    </div>
  );
};

export default MapWidget;
