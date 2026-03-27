# adminbocra

Admin dashboard for the BOCRA Regulatory Intelligence Platform.

## Stack

- Next.js
- Convex
- Clerk
- TypeScript
- Tailwind CSS

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Start Convex in one terminal:

```bash
npx convex dev
```

3. Start the Next.js app in another terminal:

```bash
pnpm run dev
```

4. Open `http://localhost:3000`

## Deployment

For Vercel, use a build command that deploys Convex and then builds Next.js:

```bash
npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd "pnpm run build"
```

## Notes

- Clerk handles authentication.
- Convex handles backend data and authorization checks.
- Admin workflows focus on escalated complaints, operator oversight, licensing, and analytics.
