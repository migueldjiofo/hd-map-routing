# app.py — Point d'entrée de l'application Flask
# Einstiegspunkt der Flask-Anwendung

from flask import Flask
from flask_cors import CORS
from routes import api_blueprint


def create_app():
    """
    FR: Crée et configure l'application Flask.
    DE: Erstellt und konfiguriert die Flask-Anwendung.
    """
    app = Flask(__name__)

    # FR: CORS autorise les requêtes depuis le frontend (port 8000)
    # DE: CORS erlaubt Anfragen vom Frontend (Port 8000)
    CORS(app, origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ])

    # FR: Enregistre tous les endpoints sous le préfixe /api
    # DE: Registriert alle Endpunkte unter dem Präfix /api
    app.register_blueprint(api_blueprint, url_prefix="/api")

    return app


if __name__ == "__main__":
    app = create_app()
    print("=" * 50)
    print("  HD-Map Routing — Backend API")
    print("  http://localhost:5000")
    print("  POST http://localhost:5000/api/route")
    print("  GET  http://localhost:5000/api/health")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)