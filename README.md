# běhna 2‰ — signup page

A one-page, brutalist black-&-white signup for **Běh na dvě promile** — pij dokud
nemáš 2 promile, pak běž 2 km. Static site, meant for **GitHub Pages**.

The joke: there are two buttons. **samozřejmě** (yes) works. **sorry ale ne** (no)
runs away from your cursor and only lets itself be caught after a short chase — and
even then it signs you up anyway. There's no way out. 🍺

## Files

| File | What it is |
|------|------------|
| `index.html` | the page |
| `style.css` | the design |
| `script.js` | evasive button + signup logic (**edit `SCRIPT_URL` here**) |
| `apps-script.gs` | the Google Apps Script that saves signups to a Sheet |
| `posteBEHkipchoge.png` | the original poster (used for the share preview) |

---

## Setting up the overview (Google Sheet)

You'll get a live spreadsheet with every signup: **timestamp, name, their answer,
device**. Free, unlimited, no accounts to manage.

1. Create a new Google Sheet (e.g. named `běhna 2‰ – přihlášky`).
2. **Extensions → Apps Script**. Delete the default code.
3. Paste the entire contents of [`apps-script.gs`](apps-script.gs). Save (💾).
4. **Deploy → New deployment**.
   - Click the gear ⚙️ → **Web app**.
   - **Execute as:** *Me*.
   - **Who has access:** *Anyone*  ← important, must be "Anyone", not "Anyone with Google account".
   - **Deploy**, authorize when prompted (it's your own script, the scary warning is normal — *Advanced → Go to project*).
5. Copy the **Web app URL** (ends in `/exec`).
6. Open [`script.js`](script.js) and paste it into:
   ```js
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfyc..../exec";
   ```
7. Done. Every signup now appends a row to the Sheet — **that Sheet is your overview.**

> Tip: open the `/exec` URL in a browser — it should say *"běhna signup endpoint is
> running."* If you later change `apps-script.gs`, you must **Deploy → Manage
> deployments → edit → New version** (or the changes won't go live).

### Backup
Every signup is also stored in the visitor's own browser `localStorage`
(`behna_signups`), so nothing is lost even if the network hiccups mid-submit.

---

## Publishing on GitHub Pages

1. Create a GitHub repo and push these files (see below).
2. Repo **Settings → Pages**.
3. **Source:** *Deploy from a branch* → branch `main`, folder `/ (root)` → **Save**.
4. After ~1 minute your page is live at
   `https://<your-username>.github.io/<repo-name>/`.

```bash
cd /Users/senorricardo/01_Projects/2Promile_signup
git init
git add .
git commit -m "běhna 2‰ signup page"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

> Do step 6 above (paste `SCRIPT_URL`) **before** pushing, or push again after.

---

## Local preview

Just open `index.html` in a browser, or run a tiny server so fonts/paths behave:

```bash
cd /Users/senorricardo/01_Projects/2Promile_signup
python3 -m http.server 8000
# → http://localhost:8000
```

## Tweaks

- **Chase length:** `DODGES_TO_CATCH` in `script.js` (default `6`).
- **Taunts / copy:** the `taunts` array and headings in `script.js`.
- **Colors / type:** CSS variables at the top of `style.css`.
