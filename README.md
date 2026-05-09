# lux-aeterna

In memoriam app built with Next.js.

## MVP included

- Single memorial page with:
  - title: `In memoriam`
  - deceased name
  - birth/death dates
  - tribute text
  - centered portrait image
- Local content model in `/home/runner/work/lux-aeterna/lux-aeterna/content/memorialProfile.js`
- Mobile-first responsive and accessible presentation
- Static rendering (`force-static`) for fast, reliable delivery

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to update memorial content

Edit `/home/runner/work/lux-aeterna/lux-aeterna/content/memorialProfile.js`:

- `title`
- `name`
- `birthDate`
- `deathDate`
- `tribute`
- `image.src` and `image.alt`

Place your actual portrait image in `/home/runner/work/lux-aeterna/lux-aeterna/public/images/` and point `image.src` to it.

## Future phases

- Phase 2: typography/animation polish and richer SEO/social metadata
- Phase 3: multi-memorial support and admin/content management
- If guest messages are introduced later, add moderation and abuse controls
- If privacy is needed, add private-link or authenticated access options
