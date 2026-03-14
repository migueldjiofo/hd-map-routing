// map.js — Gestion de la carte Leaflet
// Leaflet-Kartenverwaltung

const MapManager = {

  map: null,
  startMarker: null,
  endMarker: null,
  standardPolyline: null,
  elevationPolyline: null,

  // FR: 'start' = prochain clic définit le départ, 'end' = définit l'arrivée
  // DE: 'start' = nächster Klick setzt Startpunkt, 'end' = setzt Zielpunkt
  clickMode: 'start',

  COLORS: {
    standard:  '#4A9EFF',
    elevation: '#00C9A7',
  },

  // -------------------------------------------------------------------
  // FR: Initialisation de la carte centrée sur Freiburg
  // DE: Initialisierung der Karte zentriert auf Freiburg
  // -------------------------------------------------------------------
  init() {
    this.map = L.map('map', {
      center: [47.9990, 7.8421],
      zoom: 14,
    });

    // FR: Tuiles CartoDB Dark Matter — style sombre cohérent avec le thème
    // DE: CartoDB Dark Matter Kacheln — dunkler Stil passend zum Theme
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(this.map);

    // FR: Écoute les clics sur la carte pour placer start/end
    // DE: Klicks auf der Karte werden abgehört um Start/Ziel zu setzen
    this.map.on('click', (e) => this._onMapClick(e));
  },

  // -------------------------------------------------------------------
  // FR: Place le marqueur de départ
  // DE: Setzt den Startmarker
  // -------------------------------------------------------------------
  setStartMarker(lat, lon) {
    if (this.startMarker) this.map.removeLayer(this.startMarker);

    const icon = L.divIcon({
      className: '',
      html: '<div class="marker-start"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    this.startMarker = L.marker([lat, lon], { icon })
      .bindPopup(this._buildPopup('Startpunkt', lat, lon))
      .addTo(this.map);
  },

  // -------------------------------------------------------------------
  // FR: Place le marqueur d'arrivée
  // DE: Setzt den Zielmarker
  // -------------------------------------------------------------------
  setEndMarker(lat, lon) {
    if (this.endMarker) this.map.removeLayer(this.endMarker);

    const icon = L.divIcon({
      className: '',
      html: '<div class="marker-end"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
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

    // FR: Route standard en bleu — légèrement transparente (arrière-plan)
    // DE: Standard-Route in Blau — leicht transparent (Hintergrund)
    this.standardPolyline = L.polyline(standardCoords, {
      color:   this.COLORS.standard,
      weight:  4,
      opacity: 0.8,
    }).addTo(this.map);

    this.standardPolyline.bindPopup(
      '<b>Standard-Route</b><br>Schnellste Route'
    );

    // FR: Route optimisée en vert — au premier plan
    // DE: Höhenoptimierte Route in Grün — im Vordergrund
    this.elevationPolyline = L.polyline(elevationCoords, {
      color:   this.COLORS.elevation,
      weight:  4,
      opacity: 0.9,
    }).addTo(this.map);

    this.elevationPolyline.bindPopup(
      '<b>Höhenoptimierte Route</b><br>Weniger Steigung, energiesparend'
    );

    // FR: Zoom automatique pour voir les deux routes
    // DE: Automatischer Zoom um beide Routen zu sehen
    const bounds = L.featureGroup([
      this.standardPolyline,
      this.elevationPolyline,
    ]).getBounds();

    this.map.fitBounds(bounds, { padding: [40, 40] });
  },

  // -------------------------------------------------------------------
  // FR: Supprime les routes de la carte
  // DE: Entfernt die Routen von der Karte
  // -------------------------------------------------------------------
  clearRoutes() {
    if (this.standardPolyline)  this.map.removeLayer(this.standardPolyline);
    if (this.elevationPolyline) this.map.removeLayer(this.elevationPolyline);
    this.standardPolyline  = null;
    this.elevationPolyline = null;
  },

  // -------------------------------------------------------------------
  // FR: Gère les clics sur la carte (alternance start/end)
  // DE: Verarbeitet Klicks auf der Karte (Wechsel start/end)
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

  // -------------------------------------------------------------------
  // FR: Construit le contenu HTML d'un popup de marqueur
  // DE: Erstellt den HTML-Inhalt eines Marker-Popups
  // -------------------------------------------------------------------
  _buildPopup(title, lat, lon) {
    return `
      <div class="popup-title">${title}</div>
      <div class="popup-coords">${lat.toFixed(5)}, ${lon.toFixed(5)}</div>
    `;
  },

};