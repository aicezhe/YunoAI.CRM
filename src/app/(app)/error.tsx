"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

/**
 * Last resort for a signed-in route. Screens are expected to render their own
 * failure states, so reaching here means a genuine unexpected throw — this
 * exists so that path still ends in a usable page with a way out, instead of
 * Next's bare "Application error" in production.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        The page didn&apos;t load. Trying again usually helps.
      </p>

      {/* The digest is the only handle on a production stack trace, which is
          deliberately not shown — worth surfacing so a bug report can be tied
          to a server log line. */}
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-gray-400">Reference: {error.digest}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-10 items-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
