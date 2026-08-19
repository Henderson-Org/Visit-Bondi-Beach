import type { Metadata } from 'next';
import { adminConfigured } from '@/lib/admin/auth';

export const metadata: Metadata = {
  title: { absolute: 'Sign in' },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ error?: string; next?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;
  const configured = adminConfigured();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl text-ink-900">Visit Bondi Beach analytics</h1>
      <p className="mt-2 text-sm text-ink-600">This area is private.</p>

      {!configured ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-ink-800"
        >
          <p className="font-medium">Admin access is not configured.</p>
          <p className="mt-1">
            Set <code className="font-mono text-xs">ADMIN_PASSWORD</code> and a
            32+ character <code className="font-mono text-xs">ADMIN_SESSION_SECRET</code> in the
            deployment environment, then redeploy.
          </p>
        </div>
      ) : (
        <form action="/api/admin/login" method="POST" className="mt-6 space-y-4">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              Incorrect password.
            </p>
          )}
          <input type="hidden" name="next" value={next ?? '/admin'} />
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-800">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              className="mt-1 w-full rounded-lg border border-sand-300 px-3 py-2 text-ink-900 focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-ocean-600 px-4 py-2.5 font-medium text-white transition hover:bg-ocean-700 focus:outline-none focus:ring-2 focus:ring-ocean-300"
          >
            Sign in
          </button>
        </form>
      )}
    </main>
  );
}
