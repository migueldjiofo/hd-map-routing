# routes.py — Endpoints de l'API Flask
# API-Endpunkte der Flask-Anwendung

from flask import Blueprint, request, jsonify
from graphhopper_client import GraphHopperClient
from utils import validate_coordinates, format_error, format_success

api_blueprint = Blueprint("api", __name__)
gh_client = GraphHopperClient(base_url="http://localhost:8989")


# -----------------------------------------------------------------------------
# POST /api/route
# -----------------------------------------------------------------------------
@api_blueprint.route("/route", methods=["POST"])
def calculate_route():
    """
    FR: Calcule les deux routes (standard + optimisée).
    DE: Berechnet beide Routen (Standard + höhenoptimiert).
    """
    data = request.get_json()
    if not data:
        return jsonify(format_error("Le corps de la requête doit être du JSON")), 400

    required = ["start_lat", "start_lon", "end_lat", "end_lon"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify(format_error(f"Paramètres manquants: {', '.join(missing)}")), 400

    try:
        start_lat = float(data["start_lat"])
        start_lon = float(data["start_lon"])
        end_lat   = float(data["end_lat"])
        end_lon   = float(data["end_lon"])
    except (ValueError, TypeError):
        return jsonify(format_error("Les coordonnées doivent être des nombres valides")), 400

    error = validate_coordinates(start_lat, start_lon, end_lat, end_lon)
    if error:
        return jsonify(format_error(error)), 400

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
# POST /api/isochrone
# FR: Calcule une zone d'accessibilité depuis un point
# DE: Berechnet eine Erreichbarkeitszone von einem Punkt
# -----------------------------------------------------------------------------
@api_blueprint.route("/isochrone", methods=["POST"])
def calculate_isochrone():
    """
    FR: Reçoit un point et un temps limite, retourne le polygone d'isochrone.
    DE: Empfängt einen Punkt und ein Zeitlimit, gibt das Isochronen-Polygon zurück.

    Body: { lat, lon, time_minutes, profile }
    """
    data = request.get_json()
    if not data:
        return jsonify(format_error("JSON body erforderlich")), 400

    required = ["lat", "lon", "time_minutes"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify(format_error(f"Fehlende Parameter: {', '.join(missing)}")), 400

    try:
        lat          = float(data["lat"])
        lon          = float(data["lon"])
        time_minutes = int(data["time_minutes"])
        profile      = data.get("profile", "bike")
    except (ValueError, TypeError):
        return jsonify(format_error("Ungültige Parameter")), 400

    if not (1 <= time_minutes <= 60):
        return jsonify(format_error("time_minutes doit être entre 1 et 60")), 400

    try:
        isochrone = gh_client.get_isochrone(
            lat, lon,
            profile=profile,
            time_limit_seconds=time_minutes * 60
        )
    except ConnectionError as e:
        return jsonify(format_error(str(e))), 503
    except ValueError as e:
        return jsonify(format_error(str(e))), 404

    return jsonify({
        "status":    "success",
        "isochrone": isochrone
    }), 200


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