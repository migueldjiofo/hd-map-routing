# utils.py — Fonctions utilitaires
# Hilfsfunktionen — Validierung und Antwortformatierung


def validate_coordinates(start_lat, start_lon, end_lat, end_lon):
    """
    FR: Valide les 4 coordonnées. Retourne un message d'erreur ou None.
    DE: Validiert die 4 Koordinaten. Gibt Fehlermeldung oder None zurück.
    """
    if not (-90 <= start_lat <= 90):
        return "start_lat muss zwischen -90 und 90 liegen"
    if not (-180 <= start_lon <= 180):
        return "start_lon muss zwischen -180 und 180 liegen"
    if not (-90 <= end_lat <= 90):
        return "end_lat muss zwischen -90 und 90 liegen"
    if not (-180 <= end_lon <= 180):
        return "end_lon muss zwischen -180 und 180 liegen"
    if start_lat == end_lat and start_lon == end_lon:
        return "Start- und Zielkoordinaten dürfen nicht identisch sein"
    return None


def format_error(message):
    """
    FR: Formate une réponse d'erreur uniforme.
    DE: Formatiert eine einheitliche Fehlerantwort.
    """
    return {
        "status":  "error",
        "message": message
    }


def format_success(standard_route, elevation_route):
    """
    FR: Formate une réponse de succès avec les deux routes enrichies.
    DE: Formatiert eine Erfolgsantwort mit beiden angereicherten Routen.
    """
    return {
        "status":                    "success",
        "standard_route":            standard_route,
        "elevation_optimized_route": elevation_route,
    }