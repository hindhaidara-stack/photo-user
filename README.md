# Photo User (Angular)

Progressive Web App Angular 19 + Material : prends des photos depuis le téléphone, stocke-les en local (IndexedDB) et envoie-les par email via un **vrai serveur SMTP** (Nodemailer côté serverless Vercel).

## Fonctionnalités

- Bouton **Prendre une photo** → ouvre la caméra (face arrière par défaut, switch possible)
- **Répertoire** des photos prises (stockage local IndexedDB — rien ne quitte le téléphone tant que tu n'envoies pas)
- Pour chaque photo : **Envoyer par email** (SMTP via fonction serverless) ou **Supprimer**
- **Installable** sur le téléphone (bouton dans la toolbar)
- Fonctionne hors ligne grâce au service worker Angular (`@angular/pwa`)
- Raccourci PWA `?action=capture` qui ouvre directement la caméra

## Architecture email

Un navigateur ne peut pas parler SMTP directement. Le flux est donc :

```
[Téléphone PWA] → POST /api/send-email → [Fonction Vercel Node + Nodemailer]
                                           ↓ (SMTP_HOST/PORT/USER/PASS via env vars)
                                       [Serveur SMTP] → [Destinataire]
```

La fonction serverless est dans [api/send-email.ts](api/send-email.ts). Les identifiants SMTP restent **côté serveur uniquement** (variables d'environnement Vercel), jamais dans le navigateur.

## Démarrer en local

```powershell
npm install
npm start
```

App Angular sur `http://localhost:4200`. **Attention** : l'endpoint `/api/send-email` n'est pas servi par `ng serve`. Pour tester l'envoi email en local, utilise `vercel dev` à la place :

```powershell
npm install -g vercel
vercel dev
```

`vercel dev` sert à la fois l'app Angular et l'endpoint serverless sur le même port.

> ⚠️ La caméra exige **HTTPS** (sauf en `localhost`). Pour tester depuis ton téléphone, il faut déployer.

## Build production

```powershell
npm run build
```

Sortie : `dist/photo-pwa/browser/`. Le service worker n'est actif qu'en build production.

## Déploiement sur Vercel

### 1. Première fois

```powershell
npm install -g vercel
vercel login
vercel
```

Réponds aux questions (project name, link to existing project: no). Vercel détecte Angular et la fonction `api/`.

### 2. Configurer les variables d'environnement SMTP

Dans le dashboard Vercel → ton projet → **Settings** → **Environment Variables**, ajoute :

| Variable    | Exemple                  | Description                                      |
|-------------|--------------------------|--------------------------------------------------|
| `SMTP_HOST` | `smtp.gmail.com`         | Hôte SMTP                                        |
| `SMTP_PORT` | `587` ou `465`           | Port (465 = SSL, 587 = STARTTLS)                 |
| `SMTP_USER` | `monadresse@gmail.com`   | Identifiant SMTP                                 |
| `SMTP_PASS` | `xxxxxxxxxxxxxxxx`       | Mot de passe **ou** mot de passe d'application   |
| `SMTP_FROM` | `monadresse@gmail.com`   | (optionnel) Adresse d'expédition, sinon `SMTP_USER` |

Coche les 3 environnements (Production, Preview, Development).

**Exemples de fournisseurs** :
- **Gmail** : `smtp.gmail.com` / `465` (SSL). Active la validation en 2 étapes puis crée un [mot de passe d'application](https://myaccount.google.com/apppasswords).
- **Outlook/Hotmail** : `smtp-mail.outlook.com` / `587`. Idem, mot de passe d'application via Microsoft.
- **OVH** : `ssl0.ovh.net` / `465`.
- **Yahoo** : `smtp.mail.yahoo.com` / `465`. Mot de passe d'application.
- **Serveur perso** : utilise les paramètres de ton hébergeur.

### 3. Redéployer

```powershell
vercel --prod
```

Vercel te donne une URL `https://xxx.vercel.app`.

## Installation sur le téléphone

Une fois l'URL HTTPS ouverte sur ton téléphone :

- **Android Chrome** :
  1. Ouvre l'URL `https://xxx.vercel.app`
  2. Bouton "Installer" dans la toolbar de l'app (ou menu ⋮ → *Installer l'application*)
  3. L'icône apparaît sur l'écran d'accueil comme une vraie app
- **iOS Safari** :
  1. Ouvre l'URL `https://xxx.vercel.app`
  2. Bouton Partager → *Sur l'écran d'accueil*

À la première utilisation de la caméra, Android/iOS demandera l'autorisation. Autorise.

## Structure

```
src/
├── app/
│   ├── app.component.*               # Shell + switcher de vues
│   ├── app.config.ts                 # Providers (animations + service worker)
│   ├── models/photo.model.ts
│   ├── services/
│   │   ├── photo-storage.service.ts  # IndexedDB
│   │   ├── settings.service.ts       # localStorage (destinataire défaut + from name)
│   │   └── email.service.ts          # Appelle /api/send-email
│   └── components/
│       ├── home/             # Bouton + galerie
│       ├── camera/           # getUserMedia + capture
│       ├── photo-detail/     # Vue détail + actions (supprimer / envoyer)
│       ├── email-dialog/     # Dialog d'envoi
│       └── settings/         # Destinataire défaut + nom expéditeur
├── styles.scss
└── index.html
api/
└── send-email.ts             # Fonction serverless Vercel + Nodemailer (SMTP)
public/
├── manifest.webmanifest      # Manifest PWA
└── icons/                    # Icônes 72→512
legacy/                       # Ancienne version vanilla JS (référence)
ngsw-config.json              # Config service worker Angular
```

## Vie privée

- Photos stockées **uniquement dans le navigateur** (IndexedDB du téléphone).
- Aucun stockage côté serveur : la fonction reçoit la photo, l'envoie en pièce jointe SMTP, puis la jette.
- Les identifiants SMTP restent dans les variables d'environnement Vercel, **jamais** envoyés au navigateur.

## Limites

- Taille de body Vercel Hobby : 4,5 MB → JPEG max ~3 MB après base64. L'app capture en 1920×1080 quality 0.9 ce qui reste largement en dessous.
- iOS Safari < 16 : Web Share avec fichiers limité (mais pas utilisé ici puisqu'on a retiré l'option Enregistrer).
