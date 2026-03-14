// routing.js — Appels API vers le backend Flask
// API-Aufrufe an das Flask-Backend

const RoutingService = {

  // FR: URL de base du backend Flask
  // DE: Basis-URL des Flask-Backends
  API_BASE: 'http://localhost:5000/api',

  // -------------------------------------------------------------------
  // FR: Envoie les coordonnées au backend et retourne les deux routes
  // DE: Sendet Koordinaten ans Backend und gibt beide Routen zurück
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
      // FR: Le backend Flask n'est pas accessible
      // DE: Das Flask-Backend ist nicht erreichbar
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

};