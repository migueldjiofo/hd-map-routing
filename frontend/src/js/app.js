// app.js — Contrôleur principal de l'application
// Haupt-Controller der Anwendung

const app = {

  // -------------------------------------------------------------------
  // FR: Initialisation au chargement de la page
  // DE: Initialisierung beim Laden der Seite
  // -------------------------------------------------------------------
  init() {
    MapManager.init();
    this._setStatus('ready', 'Bereit — Koordinaten eingeben oder Karte anklicken');
    console.log('HD-Map Routing App gestartet.');
  },

  // -------------------------------------------------------------------
  // FR: Déclenché par le bouton "Route berechnen"
  // DE: Wird durch den Button "Route berechnen" ausgelöst
  // -------------------------------------------------------------------
  async calculateRoute() {

    // FR: Lire les coordonnées depuis les champs de saisie
    // DE: Koordinaten aus den Eingabefeldern lesen
    const startLat = parseFloat(document.getElementById('start_lat').value);
    const startLon = parseFloat(document.getElementById('start_lon').value);
    const endLat   = parseFloat(document.getElementById('end_lat').value);
    const endLon   = parseFloat(document.getElementById('end_lon').value);

    // FR: Validation basique côté client
    // DE: Grundlegende Client-seitige Validierung
    if ([startLat, startLon, endLat, endLon].some(isNaN)) {
      this._showError('Bitte alle vier Koordinatenfelder ausfüllen.');
      return;
    }

    // FR: Mettre l'interface en état de chargement
    // DE: UI in Ladezustand versetzen
    this._setLoading(true);
    this._hideError();
    this._hideStats();
    MapManager.clearRoutes();

    // FR: Placer les marqueurs sur la carte
    // DE: Marker auf der Karte setzen
    MapManager.setStartMarker(startLat, startLon);
    MapManager.setEndMarker(endLat, endLon);

    // FR: Appel API au backend Flask
    // DE: API-Aufruf an das Flask-Backend
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

  // -------------------------------------------------------------------
  // FR: Appelé quand les routes sont reçues avec succès
  // DE: Wird aufgerufen wenn die Routen erfolgreich empfangen wurden
  // -------------------------------------------------------------------
  _onRoutesReceived(data) {
    const std = data.standard_route;
    const elv = data.elevation_optimized_route;

    // FR: Dessiner les deux routes sur la carte
    // DE: Beide Routen auf der Karte zeichnen
    MapManager.drawRoutes(std.coordinates, elv.coordinates);

    // FR: Mettre à jour les statistiques dans la sidebar
    // DE: Statistiken in der Sidebar aktualisieren
    this._updateStats(std, elv);
    this._showStats();

    this._setStatus(
      'success',
      `Routen berechnet — Standard: ${Utils.formatDistance(std.distance_m)}`
    );
  },

  // -------------------------------------------------------------------
  // FR: Met à jour les cartes de statistiques
  // DE: Aktualisiert die Statistik-Karten
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

    // FR: Résumé des économies
    // DE: Zusammenfassung der Einsparungen
    document.getElementById('savings-box').innerHTML =
      Utils.buildSavingsSummary(std, elv);
  },

  // -------------------------------------------------------------------
  // FR: Fonctions utilitaires pour l'interface
  // DE: Hilfsfunktionen für die Benutzeroberfläche
  // -------------------------------------------------------------------
  _setLoading(isLoading) {
    const btn = document.getElementById('btn-route');
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Berechne...';
      this._setStatus('loading', 'GraphHopper berechnet Routen…');
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

// FR: Démarre l'app quand le DOM est prêt
// DE: Startet die App wenn der DOM bereit ist
document.addEventListener('DOMContentLoaded', () => app.init());