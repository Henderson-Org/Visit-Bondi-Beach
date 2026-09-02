#!/usr/bin/env node
/**
 * check-deploy-freshness.mjs — is production actually running what `main` says it should?
 *
 *   npm run deploy:check            (against www.visitbondibeach.com)
 *   BASE=http://localhost:3111 npm run deploy:check
 *
 * WHY THIS EXISTS. The repo moved to the Henderson-Org organisation and Vercel stayed
 * connected to the old owner, so pushes to `main` stopped producing builds. Nothing
 * noticed for thirteen days, because a frozen deploy on this site does not look frozen:
 * ISR keeps regenerating pages against the live weather and surf providers, so the
 * homepage still showed today's temperature and the request logs still scrolled. The code
 * was two weeks stale while every surface signal said healthy.
 *
 * The only reliable signal is the commit the running build came from, which the root
 * layout emits as <meta name="build-commit">. This compares it with origin/main.
 *
 * Read-only, and it never fails the build - it is a diagnostic, not a gate. Exit code 1
 * only when production is provably behind, so it can be wired into a cron or a check-in.
 */
import { execSync } from 'node:child_process';

const BASE = (process.env.BASE || 'https://www.visitbondibeach.com').replace(/\/$/, '');

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', maxBuffer: 1 << 20 }).trim();

let html;
try {
  const res = await fetch(BASE + '/', { redirect: 'follow' });
  if (!res.ok) {
    console.error(`✗ ${BASE}/ returned ${res.status} - cannot check.`);
    process.exit(1);
  }
  html = await res.text();
} catch (err) {
  console.error(`✗ could not reach ${BASE}: ${err.message}`);
  process.exit(1);
}

const deployed = html.match(/<meta name="build-commit" content="([^"]+)"/)?.[1] ?? null;

// origin/main is the intended production ref; fall back to local HEAD if there is no remote.
let expected;
try {
  sh('git fetch origin main --quiet');
  expected = sh('git rev-parse origin/main');
} catch {
  expected = sh('git rev-parse HEAD');
}

console.log(`— deploy freshness (${BASE}) —`);
console.log(`  origin/main : ${expected.slice(0, 7)}  ${sh(`git log -1 --pretty=%s ${expected}`).slice(0, 64)}`);

if (!deployed) {
  // Every build after this script was added emits the marker. Its absence means the live
  // build predates it - which is itself the answer.
  console.log('  deployed    : (no build-commit marker)');
  console.log('\n⚠ Production predates the build-commit marker, so it is at least one deploy behind.');
  console.log('  Check Vercel → Deployments. If the newest build is old, the Git connection is the suspect.');
  process.exit(1);
}

if (deployed === 'local') {
  console.log('  deployed    : local (built without VERCEL_GIT_COMMIT_SHA)');
  process.exit(0);
}

console.log(`  deployed    : ${deployed.slice(0, 7)}`);

if (deployed === expected) {
  console.log('\n✓ Production is running origin/main.');
  process.exit(0);
}

// Behind, ahead, or unrelated - say which, and by how much.
let behindBy = null;
try {
  behindBy = Number(sh(`git rev-list --count ${deployed}..${expected}`));
} catch {
  /* the deployed commit may not exist locally (force-push, or a stale clone) */
}

console.log(
  `\n⚠ Production is NOT running origin/main${behindBy != null ? ` - it is ${behindBy} commit(s) behind` : ''}.`,
);
console.log('  A push that produced no deployment usually means the Vercel ↔ GitHub connection is broken');
console.log('  (Vercel → Settings → Git). Reconnecting does NOT rebuild an existing commit: push again or Redeploy.');
process.exit(1);
