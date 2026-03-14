# utils.py — Fonctions utilitaires
# Hilfsfunktionen — Validierung und Antwortformatierung


def validate_coordinates(start_lat, start_lon, end_lat, end_lon):
    """
    FR: Valide les 4 coordonnées. Retourne un message d'erreur ou None si tout est ok.
    DE: Validiert die 4 Koordinaten. Gibt Fehlermeldung zurück oder None wenn alles ok.
    """
    if not (-90 <= start_lat <= 90):
        return "start_lat doit être entre -90 et 90"
    if not (-180 <= start_lon <= 180):
        return "start_lon doit être entre -180 et 180"
    if not (-90 <= end_lat <= 90):
        return "end_lat doit être entre -90 et 90"
    if not (-180 <= end_lon <= 180):
        return "end_lon doit être entre -180 et 180"
    if start_lat == end_lat and start_lon == end_lon:
        return "Le point de départ et d'arrivée ne peuvent pas être identiques"
    return None


def format_error(message):
    """
    FR: Formate une réponse d'erreur uniforme.
    DE: Formatiert eine einheitliche Fehlerantwort.
    """
    return {
        "status": "error",
        "message": message
    }


def format_success(standard_route, elevation_route):
    """
    FR: Formate une réponse de succès avec les deux routes.
    DE: Formatiert eine Erfolgsantwort mit beiden Routen.
    """
    return {
        "status": "success",
        "standard_route": standard_route,
        "elevation_optimized_route": elevation_route
    }