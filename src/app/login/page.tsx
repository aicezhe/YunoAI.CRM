import { ParticleField } from "@/components/particle-field";
import { Wordmark } from "@/components/wordmark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · YunoCRM" };

/**
 * The only page reachable without a session (see PUBLIC_PATHS in proxy.ts).
 *
 * `next` carries the page the proxy interrupted so sign-in returns the user
 * there. It is echoed into a hidden field rather than trusted directly — the
 * action re-validates it, since a query parameter is attacker-controllable.
 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = typeof next === "string" ? next : "/activities/open";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-white px-4 py-8">
      <ParticleField className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/80 p-7 shadow-brand backdrop-blur-sm sm:p-10">
        <div className="mb-8 text-center">
          <Wordmark className="text-2xl" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to your workspace.</p>
        </div>

        <LoginForm next={target} />
      </div>
    </main>
  );
}
