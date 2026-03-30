# HD-Map-Enhanced Micro-Mobility Routing

**Höhenoptimierte Routenplanung für E-Scooter und autonome Lieferroboter**

> Navigationsprojekt · Kurs Navigation WS 2025/2026 · BHT Berlin  
> **Autor:** Miguel Djiofo · **Matrikelnummer:** 880634

---

## Inhaltsverzeichnis

1. [Projektbeschreibung](#1-projektbeschreibung)
2. [Use Case](#2-use-case)
3. [Technischer Aufbau](#3-technischer-aufbau)
4. [Implementierte Funktionen](#4-implementierte-funktionen)
5. [Voraussetzungen](#5-voraussetzungen)
6. [Installation und Start](#6-installation-und-start)
7. [Anwendung benutzen](#7-anwendung-benutzen)
8. [Technische Schwierigkeiten](#8-technische-schwierigkeiten)
9. [Architektonische Änderungen](#9-architektonische-änderungen)
10. [Bezug zum Kurs](#10-bezug-zum-kurs)
11. [Quellen](#11-quellen)

---

## 1. Projektbeschreibung

Dieses Projekt wurde im Kurs **Navigation (WS 2025/2026)** an der Berliner Hochschule für Technik (BHT) entwickelt. Es handelt sich um eine vollständige Web-Navigationsanwendung für **Micro-Mobility-Fahrzeuge** (E-Scooter, Lieferroboter).

Die Anwendung berechnet und vergleicht zwei Routen zwischen einem Start- und Zielpunkt in **Freiburg im Breisgau**:

- **Standard-Route**: Die schnellste/kürzeste Verbindung (bike-Profil)
- **Höhenoptimierte Route**: Eine Route mit minimalen Steigungen, die Energie spart und den Fahrkomfort verbessert

Das HD-Map-Feature wird durch die Integration von echten **NASA SRTM-Höhendaten (30m Auflösung)** simuliert. Diese werden in die Kostenfunktion des Routing-Algorithmus eingebunden:

```
C_opt(e) = C_standard(e) + α · P(average_slope(e))
```

Kanten mit einer Steigung von mehr als 3% werden progressiv bestraft, sodass GraphHopper flachere Umwege bevorzugt.

---

## 2. Use Case

Eine Person fährt mit einem **E-Scooter** in Freiburg im Breisgau eine Stadt mit starken Höhenunterschieden (Schwarzwald-Vorland). Sie möchte eine Route, die:

- nicht unbedingt die kürzeste oder schnellste ist
- **möglichst wenig Steigung** hat, um den Akku zu schonen
- den Fahrkomfort verbessert

**Zielgruppen:**
- Endnutzer von E-Scooter- und E-Bike-Sharing-Diensten
- Betreiber von Lieferdiensten mit E-Fahrzeugen
- Forschung und Lehre im Bereich Navigation und HD-Maps

---

## 3. Technischer Aufbau

Die Anwendung folgt einer klassischen **3-Schichten-Architektur**:

```
┌─────────────────────────────────────┐
│   FRONTEND (Leaflet.js, Port 8000)  │
└──────────────┬──────────────────────┘
               │ HTTP REST API (JSON)
┌──────────────▼──────────────────────┐
│   BACKEND (Flask, Port 5000)        │
│   + OpenTopoData API (SRTM)         │
└──────────────┬──────────────────────┘
               │ HTTP
┌──────────────▼──────────────────────┐
│   ROUTING ENGINE (GraphHopper 11)   │
│   Port 8989 · OSM Freiburg          │
└─────────────────────────────────────┘
```

| Komponente | Technologie | Port |
|---|---|---|
| Routing Engine | GraphHopper 11.0 (Java) + OSM Freiburg | 8989 |
| Höhendaten | OpenTopoData API / NASA SRTM 30m | extern |
| Backend API | Python 3.13 + Flask 3.1 | 5000 |
| Frontend | HTML/CSS/JavaScript + Leaflet.js + Chart.js | 8000 |
| Geocoding | Nominatim / OpenStreetMap | extern |

**Warum Freiburg und nicht Berlin?**  
Berlin ist fast vollständig flach (max. 80m Höhenunterschied). Freiburg liegt am Rand des Schwarzwalds, der Schauinsland (1284m) bietet ideale Bedingungen, um den Unterschied zwischen den beiden Routing-Profilen sichtbar zu machen.

---

## 4. Implementierte Funktionen

| Funktion | Beschreibung |
|---|---|
| **Zwei Routing-Profile** | Standard (bike) und Höhenoptimiert (Custom Model mit `average_slope`) |
| **Adresseingabe** | Straße + Hausnummer + PLZ + Stadt via Nominatim Geocoding |
| **Kartenklick** | Start und Ziel per Klick auf die Karte setzen |
| **4 Kartenstile** | Dark, Light, OSM, Topo, Routenfarben passen sich automatisch an |
| **Echtes Höhenprofil** | Chart.js Diagramm mit NASA SRTM 30m Daten |
| **Energieschätzung** | Physikalisches Modell: `E = (m·g·Cr·d + m·g·h) / η` in Wh |
| **Isochronen** | Erreichbarkeitszone von einem Startpunkt in X Minuten |
| **Export GeoJSON** | 3D-Koordinaten (lat/lon/Höhe), kompatibel mit Apollo.auto |
| **Export GPX** | Mit Höhendaten, kompatibel mit ROS und GPS-Geräten |

---

## 5. Voraussetzungen

```
Java 17+    → für GraphHopper
Python 3.8+ → für Flask-Backend
RAM: 2 GB+  → für GraphHopper mit OSM-Daten
HDD: 2 GB+  → für OSM + Cache
```

---

## 6. Installation und Start

### Schritt 1: Repository klonen

```powershell
git clone https://github.com/migueldjiofo/hd-map-routing.git
cd hd-map-routing
```

### Schritt 2: GraphHopper einrichten

Folgende Dateien in `backend\graphhopper\` ablegen:

**GraphHopper JAR (v11.0):**
```
https://repo1.maven.org/maven2/com/graphhopper/graphhopper-web/11.0/graphhopper-web-11.0.jar
```

**OSM-Daten für Freiburg:**
```
https://download.geofabrik.de/europe/germany/baden-wuerttemberg/freiburg-regbez-260313.osm.pbf
```

> Die `config.yml` und `elevation_penalty.json` sind bereits im Repository enthalten.

### Schritt 3: Python-Abhängigkeiten installieren

```powershell
cd backend\api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Schritt 4: Anwendung starten (3 Terminals)

**Terminal 1: GraphHopper** *(beim ersten Start: 5-15 min Wartezeit)*
```powershell
cd backend\graphhopper
java -Xmx2g -jar graphhopper-web-11.0.jar server config.yml
# Warten bis: "Started application" erscheint
```

**Terminal 2: Flask Backend**
```powershell
cd backend\api
.\venv\Scripts\Activate.ps1
python app.py
# Läuft auf http://localhost:5000
```

**Terminal 3: Frontend**
```powershell
cd frontend\src
python -m http.server 8000
# Browser öffnen: http://localhost:8000
```

---

## 7. Anwendung benutzen

1. Browser öffnen: **`http://localhost:8000`**
2. **Adresse eingeben**: Startadresse und Zieladresse eingeben, dann ⌕ klicken
3. **Route berechnen** klicken
4. **Routen vergleichen:**
   - 🔵 Blau = Standard-Route (schnellste)
   - 🟢 Grün = Höhenoptimierte Route (steigungsarm)
5. **Höhenprofil** in der Sidebar anzeigen (Standard / Höhenoptimiert)
6. **Isochronen** berechnen — Erreichbarkeitszone in X Minuten
7. **Export** als GeoJSON oder GPX

**Beispiel-Adressen für deutlichen Höhenunterschied:**

| Feld | Adresse |
|---|---|
| Start | `Münsterplatz 1, 79098 Freiburg` |
| Ziel | `Schauinsland, 79254 Oberried` |

→ Aufstieg: ~916m · Energieverbrauch: ~375 Wh

---

## 8. Technische Schwierigkeiten

Während der Entwicklung gab es verschiedene technische Probleme. Diese werden hier beschrieben, zusammen mit den Lösungen.

### 8.1 Java-Versionskonflikt

GraphHopper 11 benötigt mindestens **Java 17**. Auf dem Entwicklungsrechner war jedoch nur **Java 8** installiert. Nach der Installation von Java 17 trat ein weiteres Problem auf: Windows nutzte weiterhin das alte Java 8, weil die Umgebungsvariablen `JAVA_HOME` und `PATH` noch auf den alten Pfad zeigten.

**Fehlermeldung:**
```
UnsupportedClassVersionError: class file version 61.0, recognizes up to 52.0
```

**Lösung:** Manuelle Aktualisierung von `JAVA_HOME` und `PATH` in der PowerShell als Administrator.

### 8.2 GraphHopper 11 Konfiguration: Neue Syntax

GraphHopper 11 hat eine neue Konfigurationssyntax. Es gab insgesamt **6 Iterationen** bis die Konfiguration korrekt war:

| Problem | Lösung |
|---|---|
| `vehicle: bike` nicht mehr gültig | Ersetzt durch `custom_model_files: [bike.json]` |
| `profiles_custom:` nicht mehr vorhanden | Custom Models direkt in `profiles` definiert |
| Variable `grad` existiert nicht | Korrekte Variable ist `average_slope` |
| `custom_model_files` + `custom_model` nicht kombinierbar | Separate Datei `elevation_penalty.json` erstellt |
| `graph.encoded_values` fehlt | Alle benötigten Werte explizit aufgelistet |

### 8.3 SRTM-Höhendaten: Lokale Integration gescheitert

Die ursprüngliche Architektur sah vor, dass GraphHopper die SRTM-Höhendaten direkt aus lokalen HGT-Dateien liest. Dies schlug trotz mehrerer Versuche fehl:

- Provider `srtm`: Lokale HGT-Dateien nicht gefunden
- Provider `skadi`: Format inkompatibel
- Provider `cgiar`: Gleicher Fehler, *"Elevation not supported!"*
- Unterordner `N47/`: Richtige Struktur, aber GraphHopper ignorierte die Dateien

Diese Einschränkung ist eine bekannte Kompatibilitätsproblematik zwischen GraphHopper 11 und lokal gespeicherten SRTM-Dateien.

### 8.4 Open-Elevation API: Falsche Höhendaten

Als erste externe Alternative wurde die Open-Elevation API verwendet. Diese lieferte jedoch für alle Punkte in Freiburg fast identische Werte (~190-210m), obwohl der Schauinsland 1284m hoch ist.

**Ursachen:**
- Häufige Timeouts bei der öffentlichen API
- Ungenaue Datenbasis der Open-Elevation-Instanz

**Lösung:** Wechsel zu **OpenTopoData** mit dem SRTM-30m-Datensatz der NASA.

---

## 9. Architektonische Änderungen

### 9.1 Testregion: Berlin → Freiburg im Breisgau

Berlin ist fast vollständig flach (max. ~80m Höhenunterschied). Die Standard-Route und die höhenoptimierte Route wären in Berlin fast identisch — der Unterschied wäre nicht sichtbar.

Freiburg im Breisgau bietet ideale Bedingungen: Der Schauinsland (1284m) und die umliegenden Täler zeigen deutliche Unterschiede zwischen den beiden Profilen.

### 9.2 Fahrzeugprofil: `car` → `bike`

Ein E-Scooter darf nicht auf Autobahnen fahren, kann aber Radwege nutzen. Das `bike`-Profil in GraphHopper berücksichtigt Radwege und vermeidet Schnellstraßen. korrekt für den Use Case.

### 9.3 Höhendaten: Lokal → API-basiert (OpenTopoData)

Die größte architektonische Änderung:

| Ursprüngliche Architektur | Finale Architektur |
|---|---|
| GraphHopper liest HGT-Dateien lokal | Flask ruft OpenTopoData API auf |
| Höhendaten im Routing-Graph | Höhendaten nach dem Routing hinzugefügt |
| Schwer zu konfigurieren (GH 11 Bug) | Einfach, zuverlässig, immer aktuell |
| Keine Trennung der Verantwortlichkeiten | Klare Trennung: GH = Routing, OTD = Höhe |

Der neue Datenfluss:
```
GraphHopper → Koordinaten [lat, lon]
                    ↓
          OpenTopoData API (SRTM 30m)
                    ↓
       Koordinaten [lat, lon, altitude]
                    ↓
  Aufstieg, Abstieg, Energieverbrauch, Höhenprofil
```

### 9.4 Frontend: Simulierte → Echte Höhendaten

In einer früheren Version wurde das Höhenprofil-Diagramm mit simulierten, zufälligen Werten (`Math.random()`) erzeugt. Nach der Integration von OpenTopoData wurde dies durch echte NASA SRTM 30m Höhendaten ersetzt.

---

## 10. Bezug zum Kurs

| Kursthema | Umsetzung im Projekt |
|---|---|
| **HD-Maps** | NASA SRTM 3D-Höhendaten in Routing-Kostenfunktion integriert |
| **GraphHopper** | Custom Model mit `average_slope`, zwei Profile, Isochronen |
| **Autonome Navigation** | Export für Apollo.auto (GeoJSON) und ROS (GPX) |
| **Routing-Algorithmen** | GraphHopper Landmark-Algorithmus (LM) für Custom Models |
| **Micro-Mobility** | bike-Profil statt car-Profil, realistische E-Scooter-Simulation |

---

## 11. Quellen

1. Badue, C. et al. (2021). *Self-driving cars: A survey.* Expert Systems with Applications, 165. https://doi.org/10.1016/j.eswa.2020.113816
2. Apollo Auto. (2024). *Apollo Open Platform Documentation.* Baidu Inc. https://apollo.baidu.com/docs
3. GraphHopper GmbH. (2024). *GraphHopper Routing Engine Documentation, v11.0.* https://docs.graphhopper.com/
4. OpenTopoData. (2024). *SRTM 30m Dataset API Documentation.* https://www.opentopodata.org/datasets/srtm/
5. Fowler, M. (2002). *Patterns of Enterprise Application Architecture.* Addison-Wesley.
6. OpenStreetMap Contributors. (2024). *OpenStreetMap Wiki.* https://wiki.openstreetmap.org/
7. Geofabrik GmbH. (2024). *OpenStreetMap Daten — Freiburg im Breisgau.* https://download.geofabrik.de/
8. NASA / USGS. (2014). *Shuttle Radar Topography Mission (SRTM) — 1 Arc-Second Global.* https://lpdaac.usgs.gov/products/srtmgl1v003/

---

**Letzte Aktualisierung:** März 2026  
**Lizenz:** MIT
