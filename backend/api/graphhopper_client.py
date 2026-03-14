# graphhopper_client.py — Communication avec GraphHopper
# Kommunikation mit der GraphHopper Routing-Engine

import requests


class GraphHopperClient:
    """
    FR: Envoie les requêtes HTTP à GraphHopper et normalise les réponses.
    DE: Sendet HTTP-Anfragen an GraphHopper und normalisiert die Antworten.
    """

    def __init__(self, base_url="http://localhost:8989"):
        # FR: URL de base de GraphHopper (port 8989 par défaut)
        # DE: Basis-URL von GraphHopper (Standard-Port 8989)
        self.base_url = base_url

    def get_route(self, start_lat, start_lon, end_lat, end_lon, profile):
        """
        FR: Calcule une route via GraphHopper pour le profil donné.
        DE: Berechnet eine Route via GraphHopper für das angegebene Profil.

        Paramètres / Parameter:
            profile: 'bike' (standard) ou 'bike_elevation' (optimisé)

        Retourne / Gibt zurück:
            dict avec coordinates, distance_m, duration_s,
            elevation_gain_m, elevation_loss_m
        """
        # FR: Paramètres de la requête GraphHopper
        # DE: Parameter der GraphHopper-Anfrage
        params = {
            "point": [
                f"{start_lat},{start_lon}",
                f"{end_lat},{end_lon}"
            ],
            "profile": profile,
            "points_encoded": "false",  # FR: coordonnées GeoJSON / DE: GeoJSON-Koordinaten
            "elevation": "true",        # FR: inclure les hauteurs / DE: Höhen einschließen
            "instructions": "false",    # FR: pas de navigation guidée / DE: keine Abbiegehinweise
        }

        try:
            response = requests.get(
                f"{self.base_url}/route",
                params=params,
                timeout=30
            )
        except requests.exceptions.ConnectionError:
            # FR: GraphHopper n'est pas accessible
            # DE: GraphHopper ist nicht erreichbar
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

    def _parse_response(self, data):
        """
        FR: Convertit la réponse GraphHopper en notre format API.
            GeoJSON = [longitude, latitude] → on inverse en [latitude, longitude] pour Leaflet.
        DE: Konvertiert die GraphHopper-Antwort in unser API-Format.
            GeoJSON = [Längengrad, Breitengrad] → wird zu [Breitengrad, Längengrad] für Leaflet.
        """
        path = data["paths"][0]

        # FR: Inversion lon/lat → lat/lon pour Leaflet
        # DE: Umkehrung lon/lat → lat/lon für Leaflet
        raw_coords = path["points"]["coordinates"]
        coordinates = [
            [round(c[1], 6), round(c[0], 6)]
            for c in raw_coords
        ]

        return {
            "coordinates":      coordinates,
            "distance_m":       int(path.get("distance", 0)),
            "duration_s":       int(path.get("time", 0) / 1000),  # FR: ms → s / DE: ms → s
            "elevation_gain_m": int(path.get("ascend", 0)),
            "elevation_loss_m": int(path.get("descend", 0)),
        }

    def check_health(self):
        """
        FR: Vérifie si GraphHopper répond sur /health.
        DE: Prüft ob GraphHopper auf /health antwortet.
        """
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False