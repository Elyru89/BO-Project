import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-bo-orange/15 border border-bo-orange/30 rounded-xl p-2.5">
          <Icon size={20} className="text-bo-orange" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-bo-text">{title}</h1>
          {subtitle && <p className="text-bo-subtle text-sm">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
