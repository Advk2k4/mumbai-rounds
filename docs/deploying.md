# Deploying

## Option A: Claude artifact (recommended, syncs across devices)

The app was built to run as a [Claude artifact](https://claude.ai). That gives it a private link and a small database that keeps phone and laptop in sync.

1. Build the single-file version:
   ```bash
   python3 scripts/build.py
   ```
2. Publish `dist/mumbai-rounds.html` as an artifact with the **`db`** capability. In Claude Code, ask Claude to publish the file with `capabilities: {db: {}}`.
3. Open it once, go to **Settings → Home** and set your home location (the default is a generic Andheri East point).
4. To use it on several devices or with someone else, open the artifact's **Share** menu and invite their email address as an **Editor**.
   - Someone who only has the link can view the page but can't save to the shared copy.
   - If the page is also shared by link, an Editor invited from outside your organisation loses write access.
5. Each person signs in on every device they'll use. The header badge should read **Synced**.

To update a published artifact later, rebuild and republish to the same artifact URL. The data in the database is kept.

## Option B: GitHub Pages (live at https://advk2k4.github.io/mumbai-rounds/)

[`.github/workflows/pages.yml`](../.github/workflows/pages.yml) runs `scripts/build.py --standalone` on every push to `main` and deploys the result as `index.html`. Data is kept in each visitor's browser.

## Option C: any other static host (single device per browser)

Without the Claude runtime the app stores everything in the browser's `localStorage`. It works fully, but each browser keeps its own data. Use the backup code in Settings to copy data between devices.

```bash
python3 scripts/build.py --standalone
# upload dist/mumbai-rounds.standalone.html to GitHub Pages, Netlify, etc.
```

You can also serve `src/` directly, since no build is needed.

## Local development

```bash
python3 scripts/serve.py      # http://localhost:8765
```

Edit the files in `src/` and refresh. Open a tab directly with `#plan`, `#accounts`, `#budget` or `#settings`.
