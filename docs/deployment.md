# Deployment

## Staging (now)

1. In Vercel, **Add New → Project → Import** `njhenderson-dev/Visit-Bondi-Beach`.
2. Framework preset: **Next.js** (auto-detected). No build settings to change.
3. **Do not** set `NEXT_PUBLIC_IS_PRODUCTION`. This keeps the deployment `noindex`.
4. Deploy. You get a `*.vercel.app` URL — a private staging site, safe to share for review.
   It is blocked from search engines by `app/robots.ts` and the global `noindex` in the layout.

Every push to `main` redeploys staging. Pull requests get their own preview URLs (also `noindex`).

## Going live (later — only after the pre-launch checklist in `docs/migration.md`)

1. Add the custom domain `www.visitbondibeach.com` (and apex `visitbondibeach.com`) in
   **Vercel → Project → Settings → Domains**. Set apex to redirect to `www`.
2. In **Settings → Environment Variables**, add `NEXT_PUBLIC_IS_PRODUCTION=true` to the
   **Production** environment only. Redeploy. This switches on indexing, the real robots.txt,
   and the production-domain sitemap.
3. Back up current DNS (see `migration/` notes), then point DNS at Vercel per Vercel's
   instructions. **Do not touch MX / SPF / DKIM / DMARC** — email is unaffected by the web move.
4. Verify SSL is issued, then test priority URLs, redirects, and the sitemap.
5. Submit `https://www.visitbondibeach.com/sitemap.xml` in Google Search Console.

## Rollback

See `docs/rollback-plan.md`. In short: repoint DNS back to Squarespace. Because Squarespace
stays live and untouched until after a stable launch, rollback is a DNS change, not a rebuild.
