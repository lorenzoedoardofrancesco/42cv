<div align="center">
  <img src="/public/42cv_logo.svg" height="128px" alt="42cv.dev logo">
  <h1><a href="https://42cv.dev">42cv.dev</a></h1>
  <p>🚀 Your 42 journey, recruiter-ready. Instant CV page and dynamic stats badges for 🎓 École 42 students.<br />Just sign in!</p>
  <a href="https://github.com/lorenzoedoardofrancesco/42cv/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://42cv.dev"><img src="https://img.shields.io/badge/deployed%20on-Vercel-black.svg?logo=vercel" alt="Deployed on Vercel" /></a>
  <img src="https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Next.js_16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
</div>

## ✨ Features

### 📄 Public CV - share your profile with recruiters

Generate a clean, recruiter-friendly CV page at `42cv.dev/your-login`:

- **Profile header** - display name, pool month/year, campus with country flag, profile photo (none / 42 campus / custom upload via Cloudinary), and bio with Markdown support (**bold**, *italic*, `code`)
- **Contact & links** - email, phone, address, GitHub, LinkedIn, and personal website, each with its own icon
- **42 Statistics** - level progress bar, outstanding votes, and campus cohort / cohort / all-time weekly rankings, each with recruiter-facing tooltips explaining what the numbers mean
- **Professional experience** - full-time, part-time, freelance, internship, apprenticeship, work-study; Markdown descriptions, auto-sorted by date; 42-validated entries show final score and a "Certified by 42" label
- **Certifications** - link Credly badges by URL or embed code; ownership verified by matching recipient name; displayed with badge image, issuer, and verification link
- **Selected projects** - pick up to 5 best projects shown pre-expanded; scores, outstanding vote stars, per-project GitHub links, and custom description overrides
- **Skill tags** - freeform categories with color-coded chips (Programming Languages, Tools, Libraries...); type to add, drag to reorder
- **Achievements** - curated selection from the 42 API with difficulty tier badges (easy, medium, hard, challenge)
- **42 Journey tab** - toggleable second view with a year-by-year project activity heatmap, 42 skills as bars or radar chart, and a full validated project list grouped by year with collapsible descriptions
- **Light / dark mode** - visitors can toggle; you choose the default

### 🎴 Stats badge - embed live stats in your GitHub README

- Login, campus, cursus, grade, level progress bar, 42 logo
- Coalition colors + 6 custom themes (Piscine, Neutral, Midnight, Carbon, Rose, Neon) and a Gold theme unlocked at level 21
- BlackHole countdown with color-coded urgency, or student / piscine period dates
- Optional profile photo (42 campus or custom upload), display name, email, validated project count
- Credly certification badges in the header area (max 4)
- Individual project score badge for each project (success / fail / subscribed)
- Copyable URL, Markdown, and HTML embed snippets

## 👀 Preview

### CV page

> Live example: [42cv.dev/lsimanic](https://42cv.dev/lsimanic)

[![42cv.dev/lsimanic preview](https://image.thum.io/get/width/1200/https://42cv.dev/lsimanic)](https://42cv.dev/lsimanic)

### Dashboard

> Interactive demo (no login required): [42cv.dev/demo](https://42cv.dev/demo)

[![42cv.dev dashboard demo](https://image.thum.io/get/width/1200/https://42cv.dev/demo)](https://42cv.dev/demo)

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
2. **CV:** enable *Make profile public*, fill in your contact info, add work experience, skill tags, select achievements and featured projects - your CV is live at `42cv.dev/your-login`
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

- `Next.js 16` / `React 19` - Pages Router with Turbopack, API routes for SVG generation
- `Prisma 7` - ORM with `PostgreSQL` (Neon in production), PrismaPg driver adapter
- `NextAuth v4` - authentication via 42 OAuth
- `Tailwind CSS 4` - CSS-first configuration
- `ReactDOMServer` - renders React components to static SVG markup
- `Cloudinary` - profile photo upload and storage
- `42 API` - fetches user data, coalitions, projects with rate-limited queue

## ❓ FAQ

**Why isn't my badge updating?**
User data is cached for 12 hours. GitHub also caches images via its camo proxy. To force a refresh, append `&v=2` (or any new param) to the badge URL in your README.

**Why does my badge show as a link instead of an image?**
The badge URL must return a valid SVG. If your account isn't properly linked or the API returns an error, GitHub shows the alt text as a link. Make sure you've signed in at [42cv.dev](https://42cv.dev) and linked your 42 account.

**Can I use a custom domain?**
Yes, deploy your own instance (see Self-hosting) and update the badge URLs to point to your domain.

## 👥 Contributors

<table>
  <tr>
    <td align="center"><a href="https://github.com/lorenzoedoardofrancesco"><img src="https://avatars.githubusercontent.com/u/115743465?v=4&s=100" width="100px;" alt=""/><br /><sub><b>lsimanic</b></sub></a><br />💻 Author</td>
    <td align="center"><a href="https://github.com/lanzaj"><img src="https://avatars.githubusercontent.com/u/18369961?v=4&s=100" width="100px;" alt=""/><br /><sub><b>jlanza</b></sub></a><br />🤔 Feature requests</td>
  </tr>
</table>

## 🗂️ About this project

Forked from **[badge42](https://github.com/JaeSeoKim/badge42)** by [JaeSeoKim](https://github.com/JaeSeoKim), which generated 42 stats badges for GitHub READMEs. The original service went offline in 2023 and the codebase was outdated (Next.js 12, React 17, Prisma 3).

I upgraded the stack, fixed and redesigned the badge, and kept building from there. The CV page, dashboard, journey view, certifications, and everything else grew out of that original foundation.

## 👥 [badge42](https://github.com/JaeSeoKim/badge42) - Original Contributors

All credit for the original [badge42](https://github.com/JaeSeoKim/badge42) implementation goes to [JaeSeoKim](https://github.com/JaeSeoKim) and the contributors below.

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
