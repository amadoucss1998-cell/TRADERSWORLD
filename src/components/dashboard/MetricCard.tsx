import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  accent?: "green" | "red" | "blue" | "purple" | "yellow";
  large?: boolean;
}

const accentColors = {
  green: { icon: "text-green-400", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
  red: { icon: "text-red-400", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
  blue: { icon: "text-blue-400", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
  purple: { icon: "text-indigo-400", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
  yellow: { icon: "text-yellow-400", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)" },
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, accent = "purple", large }: MetricCardProps) {
  const colors = accentColors[accent];

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all hover:translate-y-[-2px]"
      style={{
        background: "#141420",
        border: "1px solid #1e1e30",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
            {title}
          </p>
          <div className="mt-2">
            <p className={cn("font-bold text-white", large ? "text-3xl" : "text-2xl")}>
              {value}
            </p>
            {subtitle && (
              <p
                className="text-sm mt-1"
                style={{
                  color:
                    trend === "up" ? "#22c55e" :
                    trend === "down" ? "#ef4444" :
                    "#6b7280",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          <Icon size={18} className={colors.icon} />
        </div>
      </div>
    </div>
  );
}
