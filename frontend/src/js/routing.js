// routing.js — Appels API vers le backend Flask
// API-Aufrufe an das Flask-Backend

const RoutingService = {

  API_BASE: 'http://localhost:5000/api',

  // -------------------------------------------------------------------
  // FR: Calcule les deux routes via le backend Flask
  // DE: Berechnet beide Routen via Flask-Backend
  // -------------------------------------------------------------------
  async fetchRoutes(startLat, startLon, endLat, endLon) {
    let response;
    try {
      response = await fetch(`${this.API_BASE}/route`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: startLat,
          start_lon: startLon,
          end_lat:   endLat,
          end_lon:   endLon,
        }),
      });
    } catch (networkError) {
      throw new Error(
        'Backend nicht erreichbar. ' +
        'Läuft Flask auf Port 5000? → python app.py'
      );
    }

    const data = await response.json();
    if (!response.ok || data.status === 'error') {
      throw new Error(data.message || `HTTP Fehler ${response.status}`);
    }
    return data;
  },

  // -------------------------------------------------------------------
  // FR: Calcule une isochrone via le backend Flask
  // DE: Berechnet eine Isochronen via Flask-Backend
  // -------------------------------------------------------------------
  async fetchIsochrone(lat, lon, timeMinutes, profile) {
    let response;
    try {
      response = await fetch(`${this.API_BASE}/isochrone`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat:          lat,
          lon:          lon,
          time_minutes: timeMinutes,
          profile:      profile,
        }),
      });
    } catch (networkError) {
      throw new Error('Backend nicht erreichbar.');
    }

    const data = await response.json();
    if (!response.ok || data.status === 'error') {
      throw new Error(data.message || `HTTP Fehler ${response.status}`);
    }
    return data;
  },

};