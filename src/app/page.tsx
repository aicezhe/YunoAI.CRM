import { redirect } from "next/navigation";

/**
 * "/" is never really rendered — proxy.ts redirects signed-in visitors to
 * /dashboard and anonymous ones to /login before this runs. It exists so the
 * route is still handled if the proxy matcher is ever narrowed.
 */
export default function Home() {
  redirect("/dashboard");
}
