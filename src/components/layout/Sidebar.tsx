"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  TrendingUp,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{ background: "#0d0d1a", borderRight: "1px solid #1a1a30" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "#1a1a30" }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-lg leading-none tracking-tight">
            TradesWorld
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#6366f1" }}>
            Pro Trading Journal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold px-3 mb-3 uppercase tracking-wider" style={{ color: "#4b5563" }}>
          Menu
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))",
                      border: "1px solid rgba(99,102,241,0.3)",
                    }
                  : {}
              }
            >
              <Icon
                className={cn("w-4.5 h-4.5 transition-colors", active ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300")}
                size={18}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight size={14} className="text-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#1a1a30" }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            T
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">Trader</div>
            <div className="text-xs truncate" style={{ color: "#6b7280" }}>
              Pro Account
            </div>
          </div>
          <Settings size={15} className="text-gray-500 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
