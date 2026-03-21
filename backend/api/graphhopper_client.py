# graphhopper_client.py — Communication avec GraphHopper
# Kommunikation mit der GraphHopper Routing-Engine

import requests


class GraphHopperClient:
    """
    FR: Client HTTP pour GraphHopper — routing et isochrones.
    DE: HTTP-Client für GraphHopper — Routing und Isochronen.
    """

    def __init__(self, base_url="http://localhost:8989"):
        self.base_url = base_url

    def get_route(self, start_lat, start_lon, end_lat, end_lon, profile):
        """
        FR: Calcule une route via GraphHopper.
        DE: Berechnet eine Route via GraphHopper.
        """
        params = {
            "point": [
                f"{start_lat},{start_lon}",
                f"{end_lat},{end_lon}"
            ],
            "profile":        profile,
            "points_encoded": "false",
            "elevation":      "false",
            "instructions":   "false",
        }

        try:
            response = requests.get(
                f"{self.base_url}/route",
                params=params,
                timeout=30
            )
        except requests.exceptions.ConnectionError:
            raise ConnectionError(
                "GraphHopper nicht erreichbar. "
                "Bitte sicherstellen dass GraphHopper auf Port 8989 läuft."
            )

        if response.status_code == 400:
            raise ValueError("Keine Route zwischen den angegebenen Punkten gefunden.")
        if response.status_code != 200:
            raise ConnectionError(f"GraphHopper Fehler: Status {response.status_code}")

        data = response.json()
        if not data.get("paths"):
            raise ValueError("GraphHopper hat keine Route zurückgegeben.")

        return self._parse_response(data)

    def get_isochrone(self, lat, lon, profile, time_limit_seconds):
        """
        FR: Calcule une isochrone (zone d'accessibilité) depuis un point.
        DE: Berechnet eine Isochronen (Erreichbarkeitszone) von einem Punkt.

        Args:
            lat, lon: Point de départ / Startpunkt
            profile: 'bike' ou 'bike_elevation'
            time_limit_seconds: Temps max en secondes / Maximale Zeit in Sekunden

        Returns:
            dict avec 'coordinates' (polygone GeoJSON)
        """
        params = {
            "point":       f"{lat},{lon}",
            "profile":     profile,
            "time_limit":  time_limit_seconds,
            "buckets":     1,
        }

        try:
            response = requests.get(
                f"{self.base_url}/isochrone",
                params=params,
                timeout=30
            )
        except requests.exceptions.ConnectionError:
            raise ConnectionError("GraphHopper nicht erreichbar.")

        if response.status_code != 200:
            raise ConnectionError(f"Isochrone Fehler: Status {response.status_code}")

        data = response.json()
        if not data.get("polygons"):
            raise ValueError("Keine Isochronen-Daten erhalten.")

        # FR: Extraire les coordonnées du polygone GeoJSON
        # DE: Polygon-Koordinaten aus GeoJSON extrahieren
        coords = data["polygons"][0]["geometry"]["coordinates"][0]
        # FR: Convertir [lon, lat] → [lat, lon] pour Leaflet
        # DE: [lon, lat] → [lat, lon] für Leaflet umwandeln
        leaflet_coords = [[c[1], c[0]] for c in coords]

        return {
            "coordinates":    leaflet_coords,
            "time_limit_s":   time_limit_seconds,
            "center_lat":     lat,
            "center_lon":     lon,
        }

    def check_health(self):
        """
        FR: Vérifie si GraphHopper répond.
        DE: Prüft ob GraphHopper antwortet.
        """
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False

    def _parse_response(self, data):
        """
        FR: Convertit la réponse GH en notre format API.
            GeoJSON [lon, lat] → Leaflet [lat, lon]
        DE: Konvertiert GH-Antwort in unser API-Format.
            GeoJSON [lon, lat] → Leaflet [lat, lon]
        """
        path = data["paths"][0]

        raw_coords = path["points"]["coordinates"]
        coordinates = [
            [round(c[1], 6), round(c[0], 6)]
            for c in raw_coords
        ]

        return {
            "coordinates":      coordinates,
            "distance_m":       int(path.get("distance", 0)),
            "duration_s":       int(path.get("time", 0) / 1000),
            "elevation_gain_m": int(path.get("ascend", 0)),
            "elevation_loss_m": int(path.get("descend", 0)),
        }