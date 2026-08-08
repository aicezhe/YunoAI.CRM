/** The YunoCRM lockup — brand-coloured "Yuno", near-black "CRM". Kept in one
 *  component because it appears in the sidebar, the mobile header, the login
 *  card and the 404, and the two-tone split is easy to get subtly wrong. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight text-brand-500 ${className}`}>
      Yuno<span className="text-gray-900">CRM</span>
    </span>
  );
}
