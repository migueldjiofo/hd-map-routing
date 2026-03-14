# routes.py — Endpoints de l'API Flask
# API-Endpunkte der Flask-Anwendung

from flask import Blueprint, request, jsonify
from graphhopper_client import GraphHopperClient
from utils import validate_coordinates, format_error, format_success

# FR: Blueprint regroupe tous les endpoints sous /api/
# DE: Blueprint gruppiert alle Endpunkte unter /api/
api_blueprint = Blueprint("api", __name__)

# FR: Instance unique du client GraphHopper
# DE: Einzige Instanz des GraphHopper-Clients
gh_client = GraphHopperClient(base_url="http://localhost:8989")


# -----------------------------------------------------------------------------
# POST /api/route
# -----------------------------------------------------------------------------
@api_blueprint.route("/route", methods=["POST"])
def calculate_route():
    """
    FR: Reçoit les coordonnées, interroge GraphHopper pour les deux profils,
        retourne les deux routes en JSON.
    DE: Empfängt Koordinaten, fragt GraphHopper für beide Profile ab,
        gibt beide Routen als JSON zurück.
    """
    # FR: Lire le corps JSON de la requête
    # DE: JSON-Body der Anfrage lesen
    data = request.get_json()
    if not data:
        return jsonify(format_error("Le corps de la requête doit être du JSON")), 400

    # FR: Vérifier que tous les champs obligatoires sont présents
    # DE: Prüfen ob alle Pflichtfelder vorhanden sind
    required = ["start_lat", "start_lon", "end_lat", "end_lon"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify(format_error(f"Paramètres manquants: {', '.join(missing)}")), 400

    # FR: Convertir en float
    # DE: In Float umwandeln
    try:
        start_lat = float(data["start_lat"])
        start_lon = float(data["start_lon"])
        end_lat   = float(data["end_lat"])
        end_lon   = float(data["end_lon"])
    except (ValueError, TypeError):
        return jsonify(format_error("Les coordonnées doivent être des nombres valides")), 400

    # FR: Valider les coordonnées
    # DE: Koordinaten validieren
    error = validate_coordinates(start_lat, start_lon, end_lat, end_lon)
    if error:
        return jsonify(format_error(error)), 400

    # FR: Interroger GraphHopper pour les deux profils
    # DE: GraphHopper für beide Profile abfragen
    try:
        standard_route  = gh_client.get_route(
            start_lat, start_lon, end_lat, end_lon, profile="bike"
        )
        elevation_route = gh_client.get_route(
            start_lat, start_lon, end_lat, end_lon, profile="bike_elevation"
        )
    except ConnectionError as e:
        return jsonify(format_error(str(e))), 503
    except ValueError as e:
        return jsonify(format_error(str(e))), 404

    return jsonify(format_success(standard_route, elevation_route)), 200


# -----------------------------------------------------------------------------
# GET /api/health
# -----------------------------------------------------------------------------
@api_blueprint.route("/health", methods=["GET"])
def health_check():
    """
    FR: Vérifie si le backend et GraphHopper sont opérationnels.
    DE: Prüft ob Backend und GraphHopper betriebsbereit sind.
    """
    gh_online = gh_client.check_health()

    if gh_online:
        return jsonify({
            "status":      "healthy",
            "backend":     "running",
            "graphhopper": "connected"
        }), 200
    else:
        return jsonify({
            "status":      "unhealthy",
            "backend":     "running",
            "graphhopper": "disconnected"
        }), 503