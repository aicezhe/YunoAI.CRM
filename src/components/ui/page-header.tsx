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
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
