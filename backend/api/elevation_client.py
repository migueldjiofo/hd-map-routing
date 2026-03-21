# elevation_client.py — Client pour OpenTopoData (SRTM 30m)
# Client für OpenTopoData API (SRTM 30m Daten)

import requests
import math


class ElevationClient:
    """
    FR: Récupère les données d'altitude SRTM via OpenTopoData.
        Plus fiable que Open-Elevation, données NASA SRTM 30m.
    DE: Ruft SRTM-Höhendaten via OpenTopoData ab.
        Zuverlässiger als Open-Elevation, NASA SRTM 30m Daten.

    API: https://api.opentopodata.org/v1/srtm30m
    """

    # FR: OpenTopoData — données SRTM 30m, format GET
    # DE: OpenTopoData — SRTM 30m Daten, GET-Format
    API_URL = "https://api.opentopodata.org/v1/srtm30m"

    # FR: Max 100 points par requête (limite OpenTopoData)
    # DE: Max 100 Punkte pro Anfrage (OpenTopoData-Limit)
    MAX_POINTS_PER_REQUEST = 30

    def enrich_route(self, coordinates):
        """
        FR: Enrichit une liste de coordonnées [lat, lon] avec l'altitude SRTM.
        DE: Reichert eine Koordinatenliste [lat, lon] mit SRTM-Höhe an.

        Returns:
            dict avec coordinates_3d, elevation_gain_m,
                      elevation_loss_m, elevation_profile
        """
        # FR: Échantillonner les points si trop nombreux
        # DE: Punkte reduzieren wenn zu viele
        sampled = self._sample_coordinates(coordinates, self.MAX_POINTS_PER_REQUEST)

        # FR: Récupérer les altitudes depuis OpenTopoData
        # DE: Höhen von OpenTopoData abrufen
        altitudes = self._fetch_elevations(sampled)

        if altitudes is None:
            # FR: Fallback si API indisponible
            # DE: Fallback wenn API nicht verfügbar
            return self._fallback_response(coordinates)

        # FR: Construire les coordonnées 3D [lat, lon, altitude]
        # DE: 3D-Koordinaten [lat, lon, Höhe] aufbauen
        coordinates_3d = [
            [sampled[i][0], sampled[i][1], altitudes[i]]
            for i in range(len(sampled))
        ]

        # FR: Calculer le dénivelé positif et négatif
        # DE: Auf- und Abstieg berechnen
        gain, loss = self._calculate_elevation_change(altitudes)

        # FR: Construire le profil avec distances cumulées
        # DE: Höhenprofil mit kumulierten Distanzen aufbauen
        profile = self._build_profile(coordinates_3d)

        return {
            "coordinates_3d":    coordinates_3d,
            "elevation_gain_m":  gain,
            "elevation_loss_m":  loss,
            "elevation_profile": profile,
        }

    def _sample_coordinates(self, coordinates, max_points):
        """
        FR: Réduit le nombre de points par échantillonnage uniforme.
        DE: Reduziert die Punktanzahl durch gleichmäßiges Sampling.
        """
        if len(coordinates) <= max_points:
            return coordinates

        step = len(coordinates) / max_points
        sampled = [coordinates[int(i * step)] for i in range(max_points)]

        # FR: Toujours inclure le dernier point
        # DE: Letzten Punkt immer einschließen
        if sampled[-1] != coordinates[-1]:
            sampled[-1] = coordinates[-1]

        return sampled

    def _fetch_elevations(self, coordinates):
        """
        FR: Appelle OpenTopoData (format GET) et retourne les altitudes.
            Format attendu: "lat,lon|lat,lon|lat,lon"
        DE: Ruft OpenTopoData (GET-Format) auf und gibt Höhen zurück.
            Erwartetes Format: "lat,lon|lat,lon|lat,lon"
        """
        # FR: Format OpenTopoData: "lat,lon|lat,lon|..."
        # DE: OpenTopoData Format: "lat,lon|lat,lon|..."
        locations_str = "|".join([f"{c[0]},{c[1]}" for c in coordinates])

        try:
            response = requests.get(
                self.API_URL,
                params={"locations": locations_str},
                timeout=60,
            )

            if response.status_code != 200:
                print(f"OpenTopoData Fehler: {response.status_code} — {response.text[:200]}")
                return None

            data = response.json()

            if data.get("status") != "OK":
                print(f"OpenTopoData Status: {data.get('status')}")
                return None

            return [r["elevation"] for r in data["results"]]

        except Exception as e:
            print(f"OpenTopoData Exception: {e}")
            return None

    def _calculate_elevation_change(self, altitudes):
        """
        FR: Calcule le dénivelé positif (Aufstieg) et négatif (Abstieg).
        DE: Berechnet den Auf- und Abstieg aus der Höhenliste.
        """
        gain = 0
        loss = 0

        for i in range(1, len(altitudes)):
            diff = altitudes[i] - altitudes[i - 1]
            if diff > 0:
                gain += diff
            else:
                loss += abs(diff)

        return int(gain), int(loss)

    def _build_profile(self, coordinates_3d):
        """
        FR: Construit le profil d'élévation avec distance cumulée en km.
        DE: Erstellt das Höhenprofil mit kumulierter Distanz in km.
        """
        profile = []
        cumulative_dist = 0.0

        for i, point in enumerate(coordinates_3d):
            if i > 0:
                # FR: Distance Haversine entre deux points consécutifs
                # DE: Haversine-Distanz zwischen zwei aufeinanderfolgenden Punkten
                lat1 = math.radians(coordinates_3d[i-1][0])
                lat2 = math.radians(point[0])
                lon1 = math.radians(coordinates_3d[i-1][1])
                lon2 = math.radians(point[1])
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = (math.sin(dlat/2)**2 +
                     math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2)
                dist_km = 6371 * 2 * math.asin(math.sqrt(a))
                cumulative_dist += dist_km

            profile.append({
                "distance_km": round(cumulative_dist, 3),
                "altitude_m":  round(point[2], 1),
            })

        return profile

    def _fallback_response(self, coordinates):
        """
        FR: Réponse de secours si OpenTopoData est indisponible.
        DE: Fallback-Antwort wenn OpenTopoData nicht verfügbar ist.
        """
        return {
            "coordinates_3d":    [[c[0], c[1], 0] for c in coordinates],
            "elevation_gain_m":  0,
            "elevation_loss_m":  0,
            "elevation_profile": [],
        }