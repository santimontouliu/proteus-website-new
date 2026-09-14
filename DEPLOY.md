# Deploying this export

Static files, no build step. Everything here is drop-in: copy the contents of this folder into your repository root, replacing the files of the same name.

```
index.html  audit.html  ai.html  portfolio.html  es.html  ai-es.html
proteus_data.html   (redirect alias for the old homepage URL)
favicon.png  robots.txt  sitemap.xml  .nojekyll
assets/theme.js  assets/site.css  assets/site.js  assets/portfolio.js
```

`assets/legacy.css` and the old `assets/portfolio.css` are no longer referenced — the redesigned pages carry their own styles. Delete them once you are happy with the deploy.

## GitHub Pages (user site)

1. Copy the files in, commit on the branch you want to serve.
2. Settings → Pages → Source: **Deploy from a branch** → branch, folder `/ (root)`.
3. `.nojekyll` is already included, so Jekyll leaves the files alone.
4. Open `https://<user>.github.io/` and check: appearance toggle, mobile menu under 760px, the homepage signal map, the audit example explorer, and the three portfolio demos.

Pages serves from the domain root on a user site, so the relative asset paths need no changes. If you ever serve this from a **project** repo (`/<repo>/`), the paths still work — nothing is absolute.

## Search engines

The staging copy is deliberately kept out of the index:

- every page carries `<meta name="robots" content="noindex, follow">`, marked with a comment
- `robots.txt` disallows everything
- `<link rel="canonical">` still points at `https://useproteus.io/...`

Before the production deploy, remove the `noindex` line from the six pages and swap `robots.txt` for the allow-all version noted in its comment.

## Analytics

GA4 (`G-79Z1M97CPY`) loads on every page with no hostname gate, so the Pages deploy reports too. If you want the staging traffic separated later, either gate on `location.hostname` or point Pages at a second measurement ID.

## Vercel, later

No configuration needed — import the repo, framework preset **Other**, no build command, output directory the repo root. Two things worth doing there that Pages cannot:

- a permanent 301 from `/proteus_data.html` to `/` (the HTML alias here is only a browser-side fallback)
- the custom domain on `useproteus.io`, at which point the canonical tags are correct as written

## Links changed in the export

The preview pages linked to each other by their working-file names; those now point at the real filenames. Three navigation targets that had nowhere to go in the preview were wired up:

- homepage nav "Portfolio" → `portfolio.html`
- homepage "Explore interactive work samples" → `portfolio.html`
- homepage footer "Español" → `es.html`

Everything else — copy, section order, structure — is unchanged from the approved preview.
