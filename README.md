<div align="center">
  <img src="/public/42badge_logo.svg" height="128px" alt="42Badge logo">
  <h1>42Badge</h1>
  <p>🚀 Dynamically generated 42 badge for your git readmes.</p>
  <a href="https://github.com/lorenzoedoardofrancesco/42badge/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://42badge.vercel.app"><img src="https://img.shields.io/badge/deployed%20on-Vercel-black.svg?logo=vercel" alt="Deployed on Vercel" /></a>
</div>

## About this project

This project is a revival of **[badge42](https://github.com/JaeSeoKim/badge42)**, originally created by [JaeSeoKim](https://github.com/JaeSeoKim) in 2020.

The original service has been defunct since early 2023: the maintainer was serving in the military and the Vercel free tier limits caused the service to go down. The codebase was also built on outdated dependencies (Next.js 12, React 17, Prisma 3) that had accumulated breaking changes over 3 years.

I forked the project, brought it back to life with a full dependency upgrade, redesigned the badge with a premium look, and redeployed it so that 42 students can once again embed live stats in their GitHub profiles for recruiters and the community to see.

**Changes from the original:**
- `Next.js 12 → 14`, `React 17 → 18`, `Prisma 3 → 5`
- `MySQL` → `PostgreSQL` (Neon)
- Fixed broken `42 API` compatibility
- Fixed SVG badge animations (CSS was not rendering in served images)
- Rebranded to `42Badge`

## 👀 Preview

[![lsimanic's 42 stats](https://42badge.vercel.app/api/v2/stats)](https://42badge.vercel.app)

## ✨ Features

- 🎴 **Stats card** — login, campus, cursus, grade, level progress bar
- 🎨 **Coalition theming** — card color matches your coalition (or piscine theme)
- 🕳️ **BlackHole countdown** — days remaining, or student/piscine period dates
- 🏆 **Project score badges** — individual badge for each project (pass/fail/score)
- 📸 **Profile photo** — optional circular avatar on the card
- ⚙️ **Display options** — toggle name, email, and photo visibility (stored server-side)
- 🔄 **Auto-refresh** — 42 data syncs every 12 hours

## 🤓 Usage

1. Go to <https://42badge.vercel.app/> and sign in with your 42 account
2. Generate the code snippet for your profile card
3. Copy-paste into your markdown content. Simple 🥳

## 🛠️ Self-hosting

```bash
git clone https://github.com/lorenzoedoardofrancesco/42badge
cd 42badge
npm install
cp .env.example .env   # fill in your credentials
npm run db:push
npm run dev
```

See `.env.example` for the required environment variables (42 API credentials, database URL, NextAuth secret).

## 🧰 Tech stack

- `Next.js 14` / `React 18` — pages router, API routes for SVG generation
- `Prisma 5` — ORM with `PostgreSQL` (Neon in production)
- `NextAuth` — authentication via 42 OAuth
- `Tailwind CSS` — UI styling
- `ReactDOMServer` — renders React components to static SVG markup
- `42 API` — fetches user data, coalitions, projects

## ❓ FAQ

**Why isn't my badge updating?**
User data is cached for 12 hours. GitHub also caches images via its camo proxy. To force a refresh, append `&v=2` (or any new param) to the badge URL in your README.

**Why does my badge show as a link instead of an image?**
The badge URL must return a valid SVG. If your account isn't properly linked or the API returns an error, GitHub shows the alt text as a link. Make sure you've signed in at [42badge.vercel.app](https://42badge.vercel.app) and linked your 42 account.

**Can I use a custom domain?**
Yes, deploy your own instance (see Self-hosting) and update the badge URLs to point to your domain.

## 👥 Original Contributors

All credit for the original implementation goes to [JaeSeoKim](https://github.com/JaeSeoKim) and the contributors below.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/JaeSeoKim"><img src="https://avatars.githubusercontent.com/u/43610824?v=4?s=100" width="100px;" alt=""/><br /><sub><b>JaeSeoKim</b></sub></a><br />💻 Original author</td>
    <td align="center"><a href="http://sungwoo.dev"><img src="https://avatars.githubusercontent.com/u/33975709?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sungwoo Park</b></sub></a><br />🐛</td>
    <td align="center"><a href="https://github.com/pde-bakk"><img src="https://avatars.githubusercontent.com/u/36886300?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Peer de Bakker</b></sub></a><br />🐛</td>
    <td align="center"><a href="https://www.linkedin.com/in/drelipe/"><img src="https://avatars.githubusercontent.com/u/9976038?v=4?s=100" width="100px;" alt=""/><br /><sub><b>David Rodríguez Elipe</b></sub></a><br />🤔</td>
    <td align="center"><a href="http://olesgedz.github.io"><img src="https://avatars.githubusercontent.com/u/8808075?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Oles</b></sub></a><br />🐛</td>
    <td align="center"><a href="https://jkctech.nl"><img src="https://avatars.githubusercontent.com/u/2072890?v=4?s=100" width="100px;" alt=""/><br /><sub><b>JKCTech</b></sub></a><br />🐛</td>
    <td align="center"><a href="https://github.com/aabajyan"><img src="https://avatars.githubusercontent.com/u/62068860?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Arsen Abajyan</b></sub></a><br />💻 🐛</td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/leeoocca"><img src="https://avatars.githubusercontent.com/u/36135198?v=4?s=100" width="100px;" alt=""/><br /><sub><b>leeoocca</b></sub></a><br />💻 🐛</td>
    <td align="center"><a href="https://github.com/ricardoreves"><img src="https://avatars.githubusercontent.com/u/89393929?v=4?s=100" width="100px;" alt=""/><br /><sub><b>ricardoreves</b></sub></a><br />💻 🐛</td>
    <td align="center"><a href="https://github.com/Nimon77"><img src="https://avatars.githubusercontent.com/u/11821952?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nicolas Simon</b></sub></a><br />🐛</td>
    <td align="center"><a href="https://github.com/GlaceCoding"><img src="https://avatars.githubusercontent.com/u/92152391?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Guillaume</b></sub></a><br />👀 🤔</td>
    <td align="center"><a href="https://github.com/raccoman"><img src="https://avatars.githubusercontent.com/u/48388138?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Riccardo Accomando</b></sub></a><br />👀 🤔</td>
    <td align="center"><a href="https://github.com/gabcollet"><img src="https://avatars.githubusercontent.com/u/79753678?v=4?s=100" width="100px;" alt=""/><br /><sub><b>gabcollet</b></sub></a><br />🐛</td>
  </tr>
</table>
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

## 📄 License

MIT — see [LICENSE](LICENSE). This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

<p align="center"><sub>Revived and maintained by <a href="https://github.com/lorenzoedoardofrancesco">Lorenzo Edoardo Francesco Simanic</a></sub></p>
