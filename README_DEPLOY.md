# Guess the Globe – Firebase + SEO/GEO Fixed Build

## Files
- index.html
- style.css
- script.js
- firestore.rules
- firestore.indexes.json
- robots.txt
- sitemap.xml
- llms.txt

## Deploy to GitHub Pages
Commit and push all files to the repository root.

```bash
git add .
git commit -m "Fix Firebase leaderboard and add SEO GEO optimization"
git push
```

## Firestore Rules
Firebase Console → Firestore Database → Rules → paste firestore.rules → Publish.

## Test
Play a full game, submit a name, then open Firebase Console → Firestore Database → Data. A `leaderboard` collection should appear after the first successful score submission.
