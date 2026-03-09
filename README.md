<div align="center">
  <img src="/public/42cv_logo.svg" height="128px" alt="42cv.dev logo">
  <h1><a href="https://42cv.dev">42cv.dev</a></h1>
  <p>🚀 Your 42 journey, recruiter-ready. Instant CV page and dynamic stats badges for 🎓 École 42 students. Just sign in!</p>
  <a href="https://github.com/lorenzoedoardofrancesco/42cv/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://42cv.dev"><img src="https://img.shields.io/badge/deployed%20on-Vercel-black.svg?logo=vercel" alt="Deployed on Vercel" /></a>
  <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Next.js-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
</div>

## ✨ Features

### 📄 Public CV - share your profile with recruiters

Generate a clean, recruiter-friendly CV page at `42cv.dev/your-login`:

- Full name, campus, grade, cursus, pool cohort
- GitHub, LinkedIn, address, phone number in the header
- Skill bars from 42 API
- Validated projects list with scores and outstanding vote ratings
- Achievements - you choose which ones to display
- Light / dark mode (visitor can toggle, you set the default)
- Helvetica Neue typography throughout

### 🎴 Stats badge - embed live stats in your GitHub README

- Login, campus, cursus, grade, level progress bar
- Coalition colors + 5 custom themes (Midnight, Carbon, Rose, Neon) and a Gold theme unlocked at level 21
- BlackHole countdown, or student / piscine period dates
- Optional profile photo, display name, email, validated project count
- Individual project score badge for each project

## 👀 Preview

### CV page

> Live example: [42cv.dev/lsimanic](https://42cv.dev/lsimanic)

### Stats badge

[![lsimanic's 42 stats](https://42cv.dev/api/badge/cmmdrgqgb0000lmzlzuxh3798/stats?cursusId=21&coalitionId=carbon)](https://42cv.dev)
<br>
[![lsimanic's 42 stats](https://42cv.dev/api/badge/cmmdrgqgb0000lmzlzuxh3798/stats?cursusId=9&coalitionId=piscine)](https://42cv.dev)

| Project | Score |
|---------|-------|
| **kfs-4**             | [![lsimanic's 42 kfs-4 Score](https://42cv.dev/api/badge/cmmdrgqgb0000lmzlzuxh3798/project/3480663)](https://projects.intra.42.fr/projects/42cursus-kfs-4/projects_users/3480663) |
| **ft_traceroute**     | [![lsimanic's 42 ft_traceroute Score](https://42cv.dev/api/badge/cmmdrgqgb0000lmzlzuxh3798/project/3684239)](https://projects.intra.42.fr/projects/42cursus-ft_traceroute/projects_users/3684239) |
| **C Piscine Rush 00** | [![lsimanic's 42 C Piscine Rush 00 Score](https://42cv.dev/api/badge/cmmdrgqgb0000lmzlzuxh3798/project/2787028)](https://projects.intra.42.fr/projects/c-piscine-rush-00/projects_users/2787028) |

## 🤓 Usage

1. Go to <https://42cv.dev/> and sign in with your 42 account
2. **CV:** enable *Make profile public*, fill in your contact info and select achievements - your CV is live at `42cv.dev/your-login`
3. **Badge:** copy the URL or markdown snippet and paste it into your GitHub README

## 🛠️ Self-hosting

```bash
git clone https://github.com/lorenzoedoardofrancesco/42cv
cd 42cv
npm install
cp .env.example .env   # fill in your credentials
npm run db:push
npm run dev
```

See `.env.example` for the required environment variables (42 API credentials, database URL, NextAuth secret).

## 🧰 Tech stack

- `Next.js 14` / `React 18` - pages router, API routes for SVG generation
- `Prisma 5` - ORM with `PostgreSQL` (Neon in production)
- `NextAuth` - authentication via 42 OAuth
- `Tailwind CSS` - UI styling
- `ReactDOMServer` - renders React components to static SVG markup
- `42 API` - fetches user data, coalitions, projects

## ❓ FAQ

**Why isn't my badge updating?**
User data is cached for 12 hours. GitHub also caches images via its camo proxy. To force a refresh, append `&v=2` (or any new param) to the badge URL in your README.

**Why does my badge show as a link instead of an image?**
The badge URL must return a valid SVG. If your account isn't properly linked or the API returns an error, GitHub shows the alt text as a link. Make sure you've signed in at [42cv.dev](https://42cv.dev) and linked your 42 account.

**Can I use a custom domain?**
Yes, deploy your own instance (see Self-hosting) and update the badge URLs to point to your domain.

## 🗂️ About this project

This started as a revival of **[badge42](https://github.com/JaeSeoKim/badge42)**, originally created by [JaeSeoKim](https://github.com/JaeSeoKim) in 2020.

The original service went down in early 2023: the maintainer was serving in the military and the Vercel free tier limits caused the service to go offline. The codebase had also accumulated breaking changes across three years of dependency drift (Next.js 12, React 17, Prisma 3).

I started by forking it - full dependency upgrade, rewrote and redesigned the badge, fixed the broken bits, redeployed. But then I kept going. The CV page turned out to be more useful than the badge, and there's a lot more planned. What began as a revival is now its own thing.

**Changes from the original:**
- `Next.js 12 → 14`, `React 17 → 18`, `Prisma 3 → 5`
- `MySQL` → `PostgreSQL` (Neon)
- Fixed broken `42 API` compatibility
- Fixed SVG badge animations (CSS was not rendering in served images)
- Added public CV / profile page
- Rebranded to `42cv.dev`

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

MIT - see [LICENSE](LICENSE). This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

<p align="center"><sub>Revived, redesigned, and built into something more by <a href="https://github.com/lorenzoedoardofrancesco">Lorenzo Edoardo Francesco Simanic</a></sub></p>
