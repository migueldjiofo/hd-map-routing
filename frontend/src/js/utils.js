// utils.js — Fonctions utilitaires de formatage
// Hilfsfunktionen für die Formatierung von Zahlen und Texten

const Utils = {

  /**
   * FR: Formate une distance en mètres → "2.15 km" ou "950 m"
   * DE: Formatiert eine Distanz in Metern → "2.15 km" oder "950 m"
   */
  formatDistance(meters) {
    if (meters >= 1000) {
      return (meters / 1000).toFixed(2) + ' km';
    }
    return meters + ' m';
  },

  /**
   * FR: Formate une durée en secondes → "1 h 02 min" ou "7 min"
   * DE: Formatiert eine Dauer in Sekunden → "1 h 02 min" oder "7 min"
   */
  formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h} h ${String(m).padStart(2, '0')} min`;
    }
    return `${m} min`;
  },

  /**
   * FR: Formate des mètres de dénivelé → "45 m"
   * DE: Formatiert Höhenmeter → "45 m"
   */
  formatElevation(meters) {
    return Math.round(meters) + ' m';
  },

  /**
   * FR: Génère le résumé des économies entre route standard et optimisée
   * DE: Erstellt die Zusammenfassung der Einsparungen zwischen Standard und Höhenprofil
   */
  buildSavingsSummary(standard, elevation) {
    const gainSaved = standard.elevation_gain_m - elevation.elevation_gain_m;
    const distExtra = elevation.distance_m - standard.distance_m;
    const lines = [];

    if (gainSaved > 5) {
      lines.push(`↓ ${Utils.formatElevation(gainSaved)} weniger Aufstieg`);
    } else {
      lines.push(`≈ Ähnlicher Aufstieg wie Standard-Route`);
    }

    if (distExtra > 50) {
      lines.push(`+ ${Utils.formatDistance(distExtra)} Umweg für Energieersparnis`);
    } else if (distExtra <= 0) {
      lines.push(`↓ Sogar ${Utils.formatDistance(Math.abs(distExtra))} kürzer`);
    }

    return lines.join('<br>');
  },

};