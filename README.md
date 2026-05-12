# Photo PWA (Angular)

Progressive Web App Angular 19 + Material : prends une photo depuis le téléphone, enregistre-la dans la pellicule ou partage-la via les apps natives du téléphone (WhatsApp, Mail, etc.).

## Fonctionnalités

- Bouton **Prendre une photo** → ouvre la caméra du téléphone
- Une fois la photo prise :
  - **Enregistrer dans la pellicule** → ouvre le menu natif du téléphone pour sauvegarder dans Photos
  - **Partager** → ouvre le menu de partage natif (WhatsApp, Gmail, Outlook, Drive, SMS, AirDrop...)
- **Installable** sur le téléphone (bouton dans la toolbar quand l'app peut être installée)
- Fonctionne hors ligne grâce au service worker Angular (`@angular/pwa`)
- Raccourci PWA `?action=capture` qui ouvre directement la caméra

## Architecture

100 % statique : aucun backend, aucune fonction serverless, aucune variable d'environnement. Tout se passe dans le navigateur du téléphone via les APIs Web :

- `getUserMedia` pour la caméra
- `canvas.toBlob` pour la capture JPEG
- `navigator.share` (Web Share API) pour enregistrer dans la pellicule ou partager vers les apps natives
- Service worker Angular pour le mode offline

Aucune photo ne quitte le téléphone sans action explicite de l'utilisateur (et même alors, c'est l'app qu'il choisit dans le menu de partage qui transmet la photo, pas cette PWA).

## Démarrer en local

```powershell
npm install
npm start
```

App sur `http://localhost:4200`.

> ⚠️ La caméra exige **HTTPS** (sauf en `localhost`). Pour tester depuis ton téléphone, déploie d'abord.

## Build production

```powershell
npm run build
```

Sortie : `dist/photo-pwa/browser/`. Le service worker est généré en build production.

## Déploiement sur Vercel

Le repo GitHub est déjà connecté à Vercel. Tout `git push` sur `main` déclenche un redéploiement automatique.

**Aucune variable d'environnement à configurer** — l'app est 100% statique.

## Installation sur le téléphone

Une fois l'URL HTTPS ouverte sur ton téléphone :

- **Android Chrome** : bouton "Installer" dans la toolbar de l'app, ou menu ⋮ → *Installer l'application*
- **iOS Safari** : bouton Partager → *Sur l'écran d'accueil*

L'icône appareil photo apparaît sur l'écran d'accueil.

## Structure

```
src/
├── app/
│   ├── app.component.*               # Shell + switcher de vues (home/camera/detail)
│   ├── app.config.ts                 # Providers (animations + service worker)
│   └── components/
│       ├── home/             # Bouton "Prendre une photo"
│       ├── camera/           # getUserMedia + capture
│       └── photo-detail/     # Vue détail + Enregistrer / Partager
├── styles.scss
└── index.html
public/
├── favicon.svg               # Icône appareil photo bleue
├── manifest.webmanifest      # Manifest PWA
└── icons/                    # Icônes 72→512 pour installation
ngsw-config.json              # Config service worker Angular
```

## Vie privée

- Aucun stockage local (IndexedDB, localStorage non utilisés)
- Aucun backend qui reçoit les photos
- L'utilisateur garde le contrôle : c'est lui qui choisit dans le menu natif où la photo va (Photos, WhatsApp, Mail...)
