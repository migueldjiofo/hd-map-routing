// app.js — Contrôleur principal de l'application
// Haupt-Controller der Anwendung

const app = {

  activeTab: 'address',

  // FR: Données des routes pour export et graphiques
  // DE: Routendaten für Export und Diagramme
  routeData: null,
  elevationChart: null,

  // -------------------------------------------------------------------
  // FR: Initialisation
  // DE: Initialisierung
  // -------------------------------------------------------------------
  init() {
    MapManager.init();
    this._setStatus('ready', 'Bereit — Adresse eingeben oder Karte anklicken');
  },

  // -------------------------------------------------------------------
  // FR: Bascule entre les onglets Adresse / Koordinaten
  // DE: Wechselt zwischen Adress- und Koordinaten-Tab
  // -------------------------------------------------------------------
  switchTab(tab) {
    this.activeTab = tab;
    document.getElementById('panel-address').style.display =
      tab === 'address' ? 'block' : 'none';
    document.getElementById('panel-coords').style.display =
      tab === 'coords' ? 'block' : 'none';
    document.getElementById('tab-address').classList.toggle('active', tab === 'address');
    document.getElementById('tab-coords').classList.toggle('active',  tab === 'coords');
  },

  // -------------------------------------------------------------------
  // FR: Geocoding via Nominatim OSM
  // DE: Geokodierung via Nominatim OSM
  // -------------------------------------------------------------------
  async geocodeStart() {
    const address = document.getElementById('start_address').value.trim();
    if (!address) return;
    const result = await this._geocode(address);
    if (!result) {
      this._setGeoResult('start', '❌ Adresse nicht gefunden', true);
      return;
    }
    document.getElementById('start_lat').value = result.lat;
    document.getElementById('start_lon').value = result.lon;
    MapManager.setStartMarker(result.lat, result.lon);
    MapManager.map.setView([result.lat, result.lon], 15);
    this._setGeoResult('start', `✓ ${result.display_name}`, false);
  },

  async geocodeEnd() {
    const address = document.getElementById('end_address').value.trim();
    if (!address) return;
    const result = await this._geocode(address);
    if (!result) {
      this._setGeoResult('end', '❌ Adresse nicht gefunden', true);
      return;
    }
    document.getElementById('end_lat').value = result.lat;
    document.getElementById('end_lon').value = result.lon;
    MapManager.setEndMarker(result.lat, result.lon);
    this._setGeoResult('end', `✓ ${result.display_name}`, false);
  },

  async _geocode(address) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=de`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'de' }
      });
      const data = await response.json();
      if (!data || data.length === 0) return null;
      return {
        lat:          parseFloat(data[0].lat),
        lon:          parseFloat(data[0].lon),
        display_name: data[0].display_name.split(',').slice(0, 3).join(', '),
      };
    } catch (e) {
      return null;
    }
  },

  // -------------------------------------------------------------------
  // FR: Calcul des routes
  // DE: Routenberechnung
  // -------------------------------------------------------------------
  async calculateRoute() {
    const startLat = parseFloat(document.getElementById('start_lat').value);
    const startLon = parseFloat(document.getElementById('start_lon').value);
    const endLat   = parseFloat(document.getElementById('end_lat').value);
    const endLon   = parseFloat(document.getElementById('end_lon').value);

    if ([startLat, startLon, endLat, endLon].some(isNaN)) {
      this._showError(
        this.activeTab === 'address'
          ? 'Bitte erst Adressen suchen (⌕ klicken)'
          : 'Bitte alle vier Koordinatenfelder ausfüllen'
      );
      return;
    }

    this._setLoading(true);
    this._hideError();
    this._hideStats();
    MapManager.clearRoutes();
    MapManager.setStartMarker(startLat, startLon);
    MapManager.setEndMarker(endLat, endLon);

    try {
      const data = await RoutingService.fetchRoutes(
        startLat, startLon, endLat, endLon
      );
      this._onRoutesReceived(data);
    } catch (error) {
      this._showError(error.message);
      this._setStatus('error', 'Fehler bei der Routenberechnung');
    } finally {
      this._setLoading(false);
    }
  },

  _onRoutesReceived(data) {
    const std = data.standard_route;
    const elv = data.elevation_optimized_route;

    // FR: Stocker les données pour export et graphiques
    // DE: Daten für Export und Diagramme speichern
    this.routeData = data;

    MapManager.drawRoutes(std.coordinates, elv.coordinates);
    this._updateStats(std, elv);
    this._updateEnergyEstimates(std, elv);
    this._buildElevationProfile(std, elv);
    this._showStats();

    // FR: Activer les boutons d'export
    // DE: Export-Buttons aktivieren
    document.getElementById('btn-geojson').disabled = false;
    document.getElementById('btn-gpx').disabled     = false;

    this._setStatus(
      'success',
      `Routen berechnet — Standard: ${Utils.formatDistance(std.distance_m)}`
    );
  },

  // -------------------------------------------------------------------
  // FR: Estimation de la consommation d'énergie E-Scooter
  // DE: Schätzung des E-Scooter Energieverbrauchs
  // Formule: E = (m * g * Cr * d + m * g * h) / η
  // -------------------------------------------------------------------
  _updateEnergyEstimates(std, elv) {
    const stdWh = Utils.estimateEnergy(std.distance_m,  std.elevation_gain_m);
    const elvWh = Utils.estimateEnergy(elv.distance_m, elv.elevation_gain_m);

    document.getElementById('std-energy').textContent = `${stdWh} Wh`;
    document.getElementById('elv-energy').textContent = `${elvWh} Wh`;
    document.getElementById('std-energy-row').style.display = 'flex';
    document.getElementById('elv-energy-row').style.display = 'flex';
  },

  // -------------------------------------------------------------------
  // FR: Construit le profil de hauteur avec les vraies données SRTM
  //     reçues depuis Open-Elevation via le backend Flask
  // DE: Erstellt das Höhenprofil mit echten SRTM-Daten
  //     empfangen von Open-Elevation via Flask-Backend
  // -------------------------------------------------------------------
  _buildElevationProfile(std, elv) {
    // FR: Utiliser les vraies données elevation_profile de l'API
    // DE: Echte elevation_profile-Daten der API verwenden
    this._chartDataStd = this._parseElevationProfile(std.elevation_profile);
    this._chartDataElv = this._parseElevationProfile(elv.elevation_profile);

    document.getElementById('elevation-profile').style.display = 'block';
    this.showChart('standard');
  },

  _parseElevationProfile(profile) {
    // FR: Convertit le profil API {distance_km, altitude_m} en format Chart.js
    // DE: Konvertiert das API-Profil {distance_km, altitude_m} in Chart.js-Format
    if (!profile || profile.length === 0) {
      return { labels: [], values: [] };
    }

    return {
      labels: profile.map(p => p.distance_km.toFixed(2) + ' km'),
      values: profile.map(p => p.altitude_m),
    };
  },

  showChart(type) {
    // FR: Basculer les onglets du graphique
    // DE: Diagramm-Tabs wechseln
    document.getElementById('chart-tab-std').classList.toggle('active', type === 'standard');
    document.getElementById('chart-tab-elv').classList.toggle('active', type === 'elevation');

    const data  = type === 'standard' ? this._chartDataStd : this._chartDataElv;
    const color = type === 'standard' ? '#4A9EFF' : '#00C9A7';
    const canvas = document.getElementById('elevation-chart');

    if (this.elevationChart) {
      this.elevationChart.destroy();
    }

    this.elevationChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels:   data.labels,
        datasets: [{
          data:            data.values,
          borderColor:     color,
          backgroundColor: color + '22',
          borderWidth:     2,
          pointRadius:     0,
          fill:            true,
          tension:         0.4,
        }]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: {
              color: '#505870',
              font: { size: 9 },
              maxTicksLimit: 5,
            },
            grid: { color: '#252A36' }
          },
          y: {
            ticks: {
              color: '#505870',
              font: { size: 9 },
              callback: v => v + ' m'
            },
            grid: { color: '#252A36' }
          }
        }
      }
    });
  },

  // -------------------------------------------------------------------
  // FR: Calcul de l'isochrone
  // DE: Isochronen-Berechnung
  // -------------------------------------------------------------------
  async calculateIsochrone() {
    const lat     = parseFloat(document.getElementById('start_lat').value);
    const lon     = parseFloat(document.getElementById('start_lon').value);
    const time    = parseInt(document.getElementById('iso-time').value);
    const profile = document.getElementById('iso-profile').value;

    if (isNaN(lat) || isNaN(lon)) {
      this._showError('Bitte zuerst einen Startpunkt setzen');
      return;
    }

    this._setStatus('loading', 'Isochronen wird berechnet…');

    try {
      const data = await RoutingService.fetchIsochrone(lat, lon, time, profile);
      MapManager.drawIsochrone(data.isochrone.coordinates, time);
      this._setStatus('success', `Isochronen: ${time} min Erreichbarkeit`);
    } catch (error) {
      this._showError(error.message);
      this._setStatus('error', 'Fehler bei der Isochronen-Berechnung');
    }
  },

  clearIsochrone() {
    MapManager.clearIsochrone();
    this._setStatus('ready', 'Isochronen entfernt');
  },

  // -------------------------------------------------------------------
  // FR: Export GeoJSON avec coordonnées 3D (lat, lon, altitude SRTM)
  // DE: GeoJSON-Export mit 3D-Koordinaten (lat, lon, SRTM-Höhe)
  // -------------------------------------------------------------------
  exportGeoJSON() {
    if (!this.routeData) return;

    const std = this.routeData.standard_route;
    const elv = this.routeData.elevation_optimized_route;

    // FR: Utiliser coordinates_3d si disponibles, sinon coordinates
    // DE: coordinates_3d verwenden wenn verfügbar, sonst coordinates
    const stdCoords = (std.coordinates_3d || std.coordinates)
      .map(c => c.length === 3 ? [c[1], c[0], c[2]] : [c[1], c[0]]);
    const elvCoords = (elv.coordinates_3d || elv.coordinates)
      .map(c => c.length === 3 ? [c[1], c[0], c[2]] : [c[1], c[0]]);

    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name:             "Standard Route",
            profile:          "bike",
            distance_m:       std.distance_m,
            duration_s:       std.duration_s,
            elevation_gain_m: std.elevation_gain_m,
            elevation_loss_m: std.elevation_loss_m,
          },
          geometry: {
            type:        "LineString",
            coordinates: stdCoords,
          }
        },
        {
          type: "Feature",
          properties: {
            name:             "Höhenoptimierte Route",
            profile:          "bike_elevation",
            distance_m:       elv.distance_m,
            duration_s:       elv.duration_s,
            elevation_gain_m: elv.elevation_gain_m,
            elevation_loss_m: elv.elevation_loss_m,
          },
          geometry: {
            type:        "LineString",
            coordinates: elvCoords,
          }
        }
      ]
    };

    this._downloadFile(
      JSON.stringify(geojson, null, 2),
      'hd_map_routes.geojson',
      'application/json'
    );
  },

  // -------------------------------------------------------------------
  // FR: Export GPX avec altitude SRTM dans les trackpoints
  // DE: GPX-Export mit SRTM-Höhe in den Trackpoints
  // -------------------------------------------------------------------
  exportGPX() {
    if (!this.routeData) return;

    const std = this.routeData.standard_route;

    // FR: Utiliser coordinates_3d pour inclure l'altitude dans le GPX
    // DE: coordinates_3d verwenden um Höhe in GPX einzuschließen
    const coords = std.coordinates_3d || std.coordinates;
    const trackpoints = coords
      .map(c => {
        const ele = c.length === 3 ? `\n      <ele>${c[2]}</ele>` : '';
        return `    <trkpt lat="${c[0]}" lon="${c[1]}">${ele}\n    </trkpt>`;
      })
      .join('\n');

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="HD-Map Routing — BHT Berlin"
     xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>HD-Map Routing Export</name>
    <desc>Micro-Mobility Route — Freiburg im Breisgau</desc>
  </metadata>
  <trk>
    <name>Standard Route</name>
    <trkseg>
${trackpoints}
    </trkseg>
  </trk>
</gpx>`;

    this._downloadFile(gpx, 'hd_map_route.gpx', 'application/gpx+xml');
  },

  _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // -------------------------------------------------------------------
  // FR: Mise à jour des statistiques
  // DE: Aktualisierung der Statistiken
  // -------------------------------------------------------------------
  _updateStats(std, elv) {
    document.getElementById('std-distance').textContent = Utils.formatDistance(std.distance_m);
    document.getElementById('std-duration').textContent = Utils.formatDuration(std.duration_s);
    document.getElementById('std-gain').textContent     = Utils.formatElevation(std.elevation_gain_m);
    document.getElementById('std-loss').textContent     = Utils.formatElevation(std.elevation_loss_m);

    document.getElementById('elv-distance').textContent = Utils.formatDistance(elv.distance_m);
    document.getElementById('elv-duration').textContent = Utils.formatDuration(elv.duration_s);
    document.getElementById('elv-gain').textContent     = Utils.formatElevation(elv.elevation_gain_m);
    document.getElementById('elv-loss').textContent     = Utils.formatElevation(elv.elevation_loss_m);

    document.getElementById('savings-box').innerHTML =
      Utils.buildSavingsSummary(std, elv);
  },

  // -------------------------------------------------------------------
  // FR: Fonctions UI
  // DE: UI-Hilfsfunktionen
  // -------------------------------------------------------------------
  _setLoading(isLoading) {
    const btn = document.getElementById('btn-route');
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Berechne...';
      this._setStatus('loading', 'GraphHopper + Open-Elevation werden abgefragt…');
    } else {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">⟶</span> Route berechnen';
    }
  },

  _setStatus(type, message) {
    const bar = document.getElementById('status-bar');
    bar.className = `status-bar ${type}`;
    document.getElementById('status-text').textContent = message;
  },

  _setGeoResult(which, message, isError) {
    const el = document.getElementById(`${which}-geo-result`);
    el.textContent = message;
    el.className = isError ? 'geo-result error' : 'geo-result';
  },

  _showError(message) {
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-box').style.display = 'block';
  },

  _hideError() {
    document.getElementById('error-box').style.display = 'none';
  },

  _showStats() {
    document.getElementById('stats-section').style.display = 'block';
  },

  _hideStats() {
    document.getElementById('stats-section').style.display = 'none';
  },

};

document.addEventListener('DOMContentLoaded', () => app.init());