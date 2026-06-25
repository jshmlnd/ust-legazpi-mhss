const PageShell = ({ children, title, subtitle, actions }) => (
  <main className="min-h-screen bg-neutral-50 pt-12 pb-20 px-6 lg:px-10">
    <div className="mx-auto max-w-[1440px]">
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10">
          <div>
            {title && <h1 className="text-2xl font-light tracking-[-0.02em] text-neutral-900">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  </main>
);

export default PageShell;
