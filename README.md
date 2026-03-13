# 🪐 Little Planets

Un clone du jeu **Suika / Watermelon Game** avec un thème spatial.  
Faites fusionner des planètes identiques pour en créer de plus grandes !

## 🎮 Comment jouer

- **Cliquez** (ou touchez sur mobile) pour lâcher une planète
- Deux planètes **identiques** qui se touchent **fusionnent** en une plus grande
- Ne laissez pas les planètes dépasser la **ligne rouge** en haut !
- Essayez d'atteindre le **Soleil** ⭐ (la fusion ultime)

## 🚀 Déploiement

### GitHub Pages

1. Créez un nouveau repo GitHub
2. Poussez ces fichiers dedans :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USER/little-planets.git
   git push -u origin main
   ```
3. Dans les **Settings** du repo → **Pages** → Source: `main` branch → `/root`
4. Votre jeu sera disponible sur `https://VOTRE_USER.github.io/little-planets`

### Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez **Add New → Project**
3. Importez votre repo GitHub
4. Laissez tout par défaut et cliquez **Deploy**
5. C'est tout ! ✅

## 🪐 Les planètes (du plus petit au plus grand)

| # | Nom | Points |
|---|-----|--------|
| 1 | 🪨 Météorite | 1 |
| 2 | 🌑 Luna | 3 |
| 3 | 🟤 Mercure | 6 |
| 4 | 🔴 Mars | 10 |
| 5 | 🟡 Vénus | 15 |
| 6 | 🌍 Terre | 21 |
| 7 | 🔵 Neptune | 28 |
| 8 | 🩵 Uranus | 36 |
| 9 | 🪐 Saturne | 45 |
| 10 | 🟠 Jupiter | 55 |
| 11 | ⭐ Soleil | 100 |

## 🛠️ Stack technique

- **HTML5 Canvas** — rendu
- **Matter.js** — moteur physique (chargé depuis CDN)
- Zéro dépendance npm, zéro build step !

## 📁 Structure

```
little-planets/
├── index.html    # Interface & styles
├── game.js       # Logique du jeu
├── vercel.json   # Config Vercel
└── README.md
```
