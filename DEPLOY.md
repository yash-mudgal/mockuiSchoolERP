# Putting this online — use it from any network

The LAN URL (`http://192.168.29.168:5173`) only works on the same Wi-Fi. A dev tunnel works anywhere
but dies the moment this laptop sleeps. To use the app **on any device, on any network, with this
laptop switched off**, host it.

That is easy here, because this project is **pure static files**:

- no build step, no `npm install`, no server code
- every path in `index.html`, the JS imports and the CSS is **relative** — so it works from a subfolder
  (`username.github.io/school-erp/`) just as well as from a domain root
- it uses a **hash router** (`#/dashboard/principal`), so there are **no redirect/rewrite rules to
  configure** — the thing that normally breaks single-page apps on static hosts

Upload the folder. That's the whole job.

---

## Option A — Netlify Drop (fastest, no command line)

1. Go to <https://app.netlify.com/drop>
2. Drag the **`F:\Mock UI`** folder onto the page
3. You get a URL like `https://random-name-123.netlify.app` within ~30 seconds

Sign in (GitHub/Google/email) to keep the site permanently and to rename it to something presentable
like `springdale-erp.netlify.app`. Without signing in the site is temporary.

**To update it later:** drag the folder on again, or connect it to a Git repo for automatic deploys.

---

## Option B — GitHub Pages (free, permanent, best for a demo you'll reuse)

You have git installed. You need a free GitHub account.

1. On <https://github.com/new>, create a repository — e.g. `school-erp-mock`.
   It must be **Public** for GitHub Pages to work on a free account.
   Do **not** tick "Add a README".

2. In this folder, run:

   ```bash
   cd "F:/Mock UI"
   git init
   git add .
   git commit -m "Springdale School ERP mock UI"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/school-erp-mock.git
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Build and deployment**
   Source = *Deploy from a branch*, Branch = `main`, Folder = `/ (root)` → **Save**

4. Wait ~1 minute. Your URL:

   ```
   https://YOUR-USERNAME.github.io/school-erp-mock/
   ```

**To update it later:** `git add . && git commit -m "update" && git push` — live in about a minute.

> Anything you push to a public repo is visible to everyone. This project contains only generated
> mock data (no real student, staff or financial records), so that is fine here — but do check
> before pushing if you ever add real data.

---

## Option C — Surge (one command)

You have `npx`. This is the shortest path if you prefer the terminal:

```bash
cd "F:/Mock UI"
npx surge . springdale-erp.surge.sh
```

First run asks for an email and password to create a free account, then deploys. Re-run the same
command to update.

---

## Which should you pick?

| | Best for | Account needed | Permanent |
|---|---|---|---|
| **Netlify Drop** | Showing someone in the next 5 minutes | Only to keep it | Once signed in |
| **GitHub Pages** | A demo you'll present repeatedly and update | Yes (free) | Yes |
| **Surge** | Terminal-first, quick redeploys | Yes (free, inline) | Yes |

For presenting to a school group, **GitHub Pages** is the one to use — stable URL, free forever,
easy to update, and it does not depend on your laptop being on.

---

## What NOT to use for a real demo

**The VS Code dev tunnel** (`*.devtunnels.ms`). It works, but:

- it only stays up while this laptop is on, awake, with the server *and* the tunnel running
- every first-time visitor hits a security interstitial they must click through
- the relay is intermittently slow — roughly one request in six stalls for tens of seconds, which
  looks exactly like a broken app in front of an audience

It is fine for a quick check on your own phone. It is the wrong thing to send to a client.

---

## Local use is still the fastest

None of the above replaces running it locally. On any machine with Python or Node, double-click
**`start.bat`** and it serves instantly with no network involved at all. See `README.md`.
