// map.js — Gestion de la carte Leaflet
// Leaflet-Kartenverwaltung

const MapManager = {

  map: null,
  startMarker:       null,
  endMarker:         null,
  standardPolyline:  null,
  elevationPolyline: null,
  isochroneLayer:    null,
  currentTileLayer:  null,
  currentStyle:      'dark',
  clickMode:         'start',

  // FR: Couleurs des routes selon le style de carte
  // DE: Routenfarben je nach Kartenstil
  COLORS_BY_STYLE: {
    dark:  { standard: '#4A9EFF', elevation: '#00C9A7' },
    light: { standard: '#1565C0', elevation: '#E53935' },
    osm:   { standard: '#1565C0', elevation: '#E53935' },
    topo:  { standard: '#E53935', elevation: '#1A237E' },
  },

  // FR: Couleurs de l'isochrone selon le style de carte
  // DE: Isochronen-Farben je nach Kartenstil
  ISO_COLORS_BY_STYLE: {
    dark:  { color: '#FFB347', fill: '#FFB347' },
    light: { color: '#E65100', fill: '#FF6D00' },
    osm:   { color: '#6A1B9A', fill: '#AB47BC' },
    topo:  { color: '#1B5E20', fill: '#43A047' },
  },

  COLORS: { standard: '#4A9EFF', elevation: '#00C9A7' },

  TILE_STYLES: {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap &copy; OpenTopoMap',
    },
  },

  // -------------------------------------------------------------------
  // FR: Initialisation de la carte centrée sur Freiburg
  // DE: Karteninitialisierung zentriert auf Freiburg
  // -------------------------------------------------------------------
  init() {
    this.map = L.map('map', {
      center: [47.9990, 7.8421],
      zoom: 14,
    });
    this._applyTileStyle('dark');
    this.map.on('click', (e) => this._onMapClick(e));
  },

  // -------------------------------------------------------------------
  // FR: Change le style de la carte et adapte toutes les couleurs
  // DE: Ändert den Kartenstil und passt alle Farben an
  // -------------------------------------------------------------------
  setTileStyle(styleKey) {
    this._applyTileStyle(styleKey);
    document.querySelectorAll('.map-style-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.style === styleKey);
    });
  },

  _applyTileStyle(styleKey) {
    const style = this.TILE_STYLES[styleKey];
    if (!style) return;

    if (this.currentTileLayer) this.map.removeLayer(this.currentTileLayer);

    this.currentTileLayer = L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: 19,
    }).addTo(this.map);

    // FR: Mettre à jour le style courant
    // DE: Aktuellen Stil aktualisieren
    this.currentStyle = styleKey;

    // FR: Mettre à jour les couleurs des routes
    // DE: Routenfarben aktualisieren
    this.COLORS = this.COLORS_BY_STYLE[styleKey];

    if (this.standardPolyline) {
      this.standardPolyline.setStyle({ color: this.COLORS.standard });
    }
    if (this.elevationPolyline) {
      this.elevationPolyline.setStyle({ color: this.COLORS.elevation });
    }

    // FR: Mettre à jour la couleur de l'isochrone si elle existe
    // DE: Isochronen-Farbe aktualisieren falls vorhanden
    if (this.isochroneLayer) {
      const isoColor = this.ISO_COLORS_BY_STYLE[styleKey];
      this.isochroneLayer.setStyle({
        color:     isoColor.color,
        fillColor: isoColor.fill,
      });
    }

    // FR: Mettre à jour la légende
    // DE: Legende aktualisieren
    const legendStd = document.querySelector('.legend-line--standard');
    const legendElv = document.querySelector('.legend-line--elevation');
    if (legendStd) legendStd.style.background = this.COLORS.standard;
    if (legendElv) legendElv.style.background = this.COLORS.elevation;
  },

  // -------------------------------------------------------------------
  // FR: Markers de départ et d'arrivée
  // DE: Start- und Zielmarker
  // -------------------------------------------------------------------
  setStartMarker(lat, lon) {
    if (this.startMarker) this.map.removeLayer(this.startMarker);
    const icon = L.divIcon({
      className: '',
      html: '<div class="marker-start"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7],
    });
    this.startMarker = L.marker([lat, lon], { icon })
      .bindPopup(this._buildPopup('Startpunkt', lat, lon))
      .addTo(this.map);
  },

  setEndMarker(lat, lon) {
    if (this.endMarker) this.map.removeLayer(this.endMarker);
    const icon = L.divIcon({
      className: '',
      html: '<div class="marker-end"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7],
    });
    this.endMarker = L.marker([lat, lon], { icon })
      .bindPopup(this._buildPopup('Zielpunkt', lat, lon))
      .addTo(this.map);
  },

  // -------------------------------------------------------------------
  // FR: Dessine les deux routes sur la carte
  // DE: Zeichnet beide Routen auf der Karte
  // -------------------------------------------------------------------
  drawRoutes(standardCoords, elevationCoords) {
    this.clearRoutes();

    this.standardPolyline = L.polyline(standardCoords, {
      color:   this.COLORS.standard,
      weight:  4,
      opacity: 0.8,
    }).addTo(this.map);

    this.standardPolyline.bindPopup(
      '<b>Standard-Route</b><br>Schnellste Route'
    );

    this.elevationPolyline = L.polyline(elevationCoords, {
      color:   this.COLORS.elevation,
      weight:  4,
      opacity: 0.9,
    }).addTo(this.map);

    this.elevationPolyline.bindPopup(
      '<b>Höhenoptimierte Route</b><br>Weniger Steigung, energiesparend'
    );

    const bounds = L.featureGroup([
      this.standardPolyline,
      this.elevationPolyline,
    ]).getBounds();

    this.map.fitBounds(bounds, { padding: [40, 40] });
  },

  clearRoutes() {
    if (this.standardPolyline)  this.map.removeLayer(this.standardPolyline);
    if (this.elevationPolyline) this.map.removeLayer(this.elevationPolyline);
    this.standardPolyline  = null;
    this.elevationPolyline = null;
  },

  // -------------------------------------------------------------------
  // FR: Dessine le polygone d'isochrone avec couleur adaptée au style
  // DE: Zeichnet das Isochronen-Polygon mit stilangepasster Farbe
  // -------------------------------------------------------------------
  drawIsochrone(coordinates, timeMinutes) {
    this.clearIsochrone();

    // FR: Couleur selon le style de carte actif
    // DE: Farbe je nach aktivem Kartenstil
    const isoColor = this.ISO_COLORS_BY_STYLE[this.currentStyle];

    this.isochroneLayer = L.polygon(coordinates, {
      color:       isoColor.color,
      fillColor:   isoColor.fill,
      fillOpacity: 0.30,
      weight:      2,
      dashArray:   '6, 4',
    }).addTo(this.map);

    this.isochroneLayer.bindPopup(
      `<b>Isochronen</b><br>Erreichbar in ${timeMinutes} Minuten`
    );

    this.map.fitBounds(
      this.isochroneLayer.getBounds(),
      { padding: [30, 30] }
    );
  },

  clearIsochrone() {
    if (this.isochroneLayer) {
      this.map.removeLayer(this.isochroneLayer);
      this.isochroneLayer = null;
    }
  },

  // -------------------------------------------------------------------
  // FR: Gestion des clics sur la carte
  // DE: Klick-Verarbeitung auf der Karte
  // -------------------------------------------------------------------
  _onMapClick(e) {
    const lat = parseFloat(e.latlng.lat.toFixed(6));
    const lon = parseFloat(e.latlng.lng.toFixed(6));

    if (this.clickMode === 'start') {
      this.setStartMarker(lat, lon);
      document.getElementById('start_lat').value = lat;
      document.getElementById('start_lon').value = lon;
      this.clickMode = 'end';
    } else {
      this.setEndMarker(lat, lon);
      document.getElementById('end_lat').value = lat;
      document.getElementById('end_lon').value = lon;
      this.clickMode = 'start';
    }
  },

  _buildPopup(title, lat, lon) {
    return `
      <div class="popup-title">${title}</div>
      <div class="popup-coords">${lat.toFixed(5)}, ${lon.toFixed(5)}</div>
    `;
  },

};