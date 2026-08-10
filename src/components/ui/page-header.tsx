/** Title block every section opens with. One component so the heading scale,
 *  spacing and description colour stay identical across all seven screens. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  /** Optional right-hand slot — where the "New …" buttons will go once the
   *  forms ship. */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {/* Bold and a size up from where this started: the title is the one
            element allowed to dominate its screen, and at semibold-2xl it
            sat too close to the row text below to anchor anything. */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2.5 text-sm text-gray-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
