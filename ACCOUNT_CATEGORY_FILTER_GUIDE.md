# Account-Category Filter Feature - Anleitung

## Übersicht

Das Feature ist production-ready und bietet eine intuitive Benutzeroberfläche für die Account-basierte Kategorienfilterung! 🎉

## ✨ Neue Verbesserung: Automatische Kategorie-Erkennung

### Problem

Wenn Sie ein Konto mit existierenden Transaktionen auswählen, werden die entsprechenden Kategorien möglicherweise nicht angezeigt, da sie noch nicht explizit dem Konto zugeordnet sind.

### Lösung

Das System erkennt jetzt automatisch Kategorien, die durch Transaktionen mit einem Konto verbunden sind:

1. **Implizite Erkennung**: Kategorien werden automatisch angezeigt, wenn sie Transaktionen für das ausgewählte Konto haben
2. **Kombinierte Ansicht**: Sowohl explizit zugeordnete als auch durch Transaktionen verbundene Kategorien werden angezeigt
3. **Auto-Assign Funktion**: Neue API-Endpoint um Kategorien automatisch zu Konten zuzuordnen

### Neue API-Endpoints

- **GET /api/categories?accountId=xyz**: Zeigt alle relevanten Kategorien (explizit + transaktionsbasiert)
- **POST /api/categories/auto-assign/:accountId**: Erstellt explizite Zuordnungen basierend auf Transaktionen

### Test-Szenario

Wenn Sie ein Konto haben mit:

- 5 Transaktionen
- 4 verschiedene Kategorien (z.B. "Lebensmittel" 2x, "Transport" 1x, etc.)

Dann werden diese 4 Kategorien automatisch auf der `/categories` Seite angezeigt, auch ohne explizite Zuordnung.

### Debug-Informationen

Neue Console-Logs zeigen:

- 🔍 Welche Kategorien explizit zugeordnet sind
- 📊 Welche Kategorien durch Transaktionen gefunden wurden
- 🎯 Kombinierte Liste der relevanten Kategorien

## Wie es funktioniert

### 1. Konto auswählen (auf `/accounts`)

- Navigieren Sie zur Account-Seite (`/accounts`)
- Klicken Sie auf ein beliebiges Konto in der Liste
- Das Konto wird als "ausgewählt" markiert und in der Benutzeroberfläche hervorgehoben
- Die Auswahl wird automatisch im Browser gespeichert (localStorage)

### 2. Kategorien zu Konten zuordnen

- Auf der Account-Seite, klicken Sie auf das Menü-Symbol (⋮) bei einem Konto
- Wählen Sie "Kategorien verwalten"
- Im Dialog können Sie:
  - Bereits zugewiesene Kategorien sehen
  - Neue Kategorien dem Konto zuweisen (+ Button)
  - Kategorien vom Konto entfernen (- Button)

### 3. Gefilterte Kategorien anzeigen (auf `/categories`)

- Navigieren Sie zur Kategorien-Seite (`/categories`)
- Wenn ein Konto ausgewählt ist, sehen Sie oben im Header:
  - "Kategorien für [Kontoname]"
  - Ein "X" Button zum Entfernen des Filters
- Nur die Kategorien, die dem ausgewählten Konto zugeordnet sind, werden angezeigt

## Technische Details

### Frontend-Komponenten

- **AccountSelectionService**: Verwaltet die globale Konto-Auswahl
- **AccountsComponent**: Ermöglicht Konto-Auswahl und Kategorie-Zuordnung
- **CategoriesComponent**: Reagiert auf Konto-Änderungen und filtert entsprechend
- **CategoryAssignmentComponent**: Dialog für Kategorie-zu-Konto Zuordnungen

### Backend-API

- **GET /categories?accountId=xyz**: Filtert Kategorien nach Konto
- **POST /accounts/:id/categories/:categoryId**: Ordnet Kategorie zu Konto zu
- **DELETE /accounts/:id/categories/:categoryId**: Entfernt Kategorie von Konto
- **GET /accounts/:id/categories**: Zeigt alle zugeordneten Kategorien

### Datenbank

- **CategoryAccount** Tabelle: Many-to-Many Beziehung zwischen Categories und Accounts
- Automatische Fallback-Logik: Wenn keine Zuordnungen existieren, werden alle Kategorien angezeigt

## Debug-Informationen

Die Konsole zeigt detaillierte Informationen über:

- 🔍 Welches Konto für die Filterung verwendet wird
- 🏦 Details des ausgewählten Kontos
- 📂 API-Antworten für Kategorien
- 📊 Anzahl der geladenen Kategorien

## Workflow-Beispiel

1. **Setup**:
   - Gehen Sie zu `/accounts`
   - Klicken Sie auf "Girokonto" → Konto wird ausgewählt

2. **Kategorie-Zuordnung**:
   - Klicken Sie auf das Menü bei "Girokonto"
   - Wählen Sie "Kategorien verwalten"
   - Ordnen Sie z.B. "Lebensmittel" und "Transport" zu

3. **Gefilterte Ansicht**:
   - Navigieren Sie zu `/categories`
   - Sie sehen nur "Lebensmittel" und "Transport"
   - Header zeigt: "Kategorien für Girokonto"

4. **Filter entfernen**:
   - Klicken Sie auf das "X" im Header
   - Alle Kategorien werden wieder angezeigt

## Vorteile

- **Benutzerfreundlich**: Intuitive Account-basierte Kategorienfilterung
- **Persistent**: Auswahl bleibt über Browser-Sessions erhalten
- **Flexibel**: Many-to-Many Beziehungen erlauben komplexe Zuordnungen
- **Fallback**: Zeigt alle Kategorien wenn keine Zuordnungen existieren
