# Rollback plan

The migration is designed so rollback is a **DNS change, not a rebuild**. Squarespace stays
live and untouched until the new site has been stable and fully crawled.

## When to roll back
Roll back if, after cutover, priority URLs 404/500 at scale, indexing collapses, or email/forms
break and cannot be fixed quickly.

## How to roll back (fast path)
1. In your DNS provider, restore the previous records that pointed the domain at Squarespace
   (A/CNAME as captured in the pre-launch DNS backup).
2. Wait for propagation (usually minutes; up to the TTL you set before cutover — keep TTL low
   during launch).
3. Confirm the Squarespace site serves again on the domain and SSL is valid.

## What is preserved regardless
- **Email:** MX/SPF/DKIM/DMARC are never changed during the web migration, so mail is unaffected.
- **Content & migration data:** the Squarespace export and the `migration/` crawl remain the
  backup of record.
- **New site:** stays deployed on its `*.vercel.app` URL for continued fixing.

## Diagnose before rolling back
Prefer fixing forward for isolated issues (a single broken route, one wrong canonical) — roll
back only for broad, user-facing failures. Keep the Squarespace account active until the new
site is verified stable.
