# CLAUDE.md — Music Streamer

## Projektübersicht
Eine Web-App die Audio (über AUX-Kabel) vom Android-Handy in Echtzeit ins Internet streamt.
Andere Nutzer bekommen einen Link und können live zuhören.

## Kernziel
**Minimale Latenz** — das ist die oberste Priorität.

## Technologie-Entscheidungen

### Audio-Streaming: WebRTC
- WebRTC verwenden für niedrigste Latenz (50–200ms)
- Opus-Codec (WebRTC-Standard) für Musik-Streaming
- Signaling-Server über WebSockets (socket.io)
- Architektur: Sender (Android-Browser) → Signaling-Server → Zuhörer

### Stack
- **Backend:** Node.js mit Express + socket.io
- **Frontend:** Vanilla JS, kein Framework
- **Hosting:** Öffentlich erreichbar (z.B. Railway, Render oder Vercel)

### Sender
- Android-Handy (Chrome-Browser)
- Audio-Input: AUX-Kabel (wird als Mikrofon-Eingang erkannt)
- Capture über Web Audio API / getUserMedia mit `audio` constraints

## Funktionsanforderungen
1. Sender öffnet die Webseite → erlaubt Mikrofon-Zugriff → startet Stream
2. Ein einzigartiger Share-Link wird generiert und angezeigt
3. Zuhörer öffnen den Link → hören sofort live zu (kein manueller Play-Button nötig wenn möglich)
4. Verbindungsstatus wird angezeigt (verbunden / getrennt / warten)

## Design
- Minimalistisch — nur das Nötigste
- Zwei Ansichten: **Sender-View** und **Zuhörer-View**
- Sender-View: Mikrofon-Button (Start/Stop), Status-Anzeige, Share-Link
- Zuhörer-View: Verbindungsstatus, ggf. Play-Button (falls Autoplay blockiert)

## Latenz-Optimierungen (wichtig!)
- `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false` in getUserMedia
- WebRTC Buffer so klein wie möglich halten
- Keine unnötigen Zwischenschritte / Re-Encoding vermeiden
- Direkte Peer-to-Peer Verbindung bevorzugen wenn möglich

## Projektstruktur (Ziel)
```
/
├── server.js          # Node.js Express + socket.io Signaling-Server
├── public/
│   ├── index.html     # Sender-Seite
│   ├── listen.html    # Zuhörer-Seite
│   ├── sender.js      # WebRTC Sender-Logik
│   └── listener.js    # WebRTC Zuhörer-Logik
└── package.json
```

## Was NICHT gebaut wird
- Kein Aufnahme-Feature (kein Speichern von Audio)
- Kein User-Login / Authentifizierung
- Kein Chat
- Keine Playlist / Musikbibliothek
