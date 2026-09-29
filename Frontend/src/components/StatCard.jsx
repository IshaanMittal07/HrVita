export default function StatCard({ title, value, icon: Icon, iconClass = "text-blue-600", footer, footerIcon: FooterIcon, footerClass = "text-slate-500" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {Icon && <Icon className={`h-5 w-5 ${iconClass}`} />}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {footer && (
        <p className={`mt-2 flex items-center gap-1 text-xs ${footerClass}`}>
          {FooterIcon && <FooterIcon className="h-3 w-3" />}
          {footer}
        </p>
      )}
    </div>
  );
}
