This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Set the PostgreSQL connection string:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"
```

Optional feature flags:

```bash
# Enable image support for timeline events and memory entries
export ENABLE_IMAGES=true

# Enable image uploads (data URLs) in memory submission form
# (requires ENABLE_IMAGES=true)
export ENABLE_IMAGE_UPLOAD=true
```

Then run the development server:

```bash
npm run dev
# or
npm run build && npm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

There is also a full timeline view at `/timeline` that renders events in a flowing "snake-like" layout.

This project uses system fonts (`Arial, Helvetica, sans-serif`) to avoid external font network dependencies.

## Data storage

The app uses PostgreSQL for:

- candle count (`candles` table)
- condolences (`condolences` table)
- memories (`memories` table)

Memory entries include author, memory date, and optional image URLs. Timeline events in `content/memorialProfile.js` may also include `image` or `images` fields.

Tables are created automatically on first request if they do not exist.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
