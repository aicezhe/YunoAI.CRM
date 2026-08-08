import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

/**
 * Root-level 404, deliberately outside the (app) group: it also has to cover
 * URLs that matched no route at all, which never reach the authenticated
 * layout. So it links to /login rather than assuming a session — proxy.ts
 * forwards an already signed-in visitor on to the dashboard from there.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-5 text-center">
      <Wordmark className="text-lg" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-gray-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        That link doesn&apos;t lead anywhere in YunoCRM.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex min-h-10 items-center rounded-2xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        Go to YunoCRM
      </Link>
    </main>
  );
}
