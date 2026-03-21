// utils.js — Fonctions utilitaires
// Hilfsfunktionen

const Utils = {

  formatDistance(meters) {
    if (meters >= 1000) return (meters / 1000).toFixed(2) + ' km';
    return meters + ' m';
  },

  formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
    return `${m} min`;
  },

  formatElevation(meters) {
    return Math.round(meters) + ' m';
  },

  // -------------------------------------------------------------------
  // FR: Estime la consommation d'énergie d'un E-Scooter
  // DE: Schätzt den Energieverbrauch eines E-Scooters
  //
  // Modèle physique simplifié / Vereinfachtes physikalisches Modell:
  //   E_total = E_roulement + E_montée
  //   E_roulement = m * g * Cr * d        (résistance au roulement)
  //   E_montée    = m * g * h             (énergie potentielle)
  //   Rendement moteur η = 0.85
  //
  // Paramètres E-Scooter typique:
  //   m = 100 kg (scooter 15kg + personne 85kg)
  //   g = 9.81 m/s²
  //   Cr = 0.015 (coefficient de résistance au roulement)
  //   η = 0.85 (rendement moteur)
  // -------------------------------------------------------------------
  estimateEnergy(distance_m, elevation_gain_m) {
    const m  = 100;     // FR: masse totale kg / DE: Gesamtmasse kg
    const g  = 9.81;    // FR: gravité m/s² / DE: Schwerkraft m/s²
    const Cr = 0.015;   // FR: résistance roulement / DE: Rollwiderstand
    const eta = 0.85;   // FR: rendement moteur / DE: Motorwirkungsgrad

    // FR: Énergie en Joules → conversion en Wh (÷ 3600)
    // DE: Energie in Joule → Umrechnung in Wh (÷ 3600)
    const E_roulement = m * g * Cr * distance_m;
    const E_montee    = m * g * elevation_gain_m;
    const E_total_Wh  = (E_roulement + E_montee) / eta / 3600;

    return Math.round(E_total_Wh);
  },

  buildSavingsSummary(standard, elevation) {
    const gainSaved = standard.elevation_gain_m - elevation.elevation_gain_m;
    const distExtra = elevation.distance_m - standard.distance_m;
    const stdWh     = Utils.estimateEnergy(standard.distance_m,  standard.elevation_gain_m);
    const elvWh     = Utils.estimateEnergy(elevation.distance_m, elevation.elevation_gain_m);
    const whSaved   = stdWh - elvWh;

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

    if (whSaved > 0) {
      lines.push(`⚡ ${whSaved} Wh gespart (${Math.round(whSaved/stdWh*100)}%)`);
    }

    return lines.join('<br>');
  },

};