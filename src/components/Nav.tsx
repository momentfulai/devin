"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Today", icon: "home" },
  { href: "/risk", label: "Risk", icon: "shield" },
  { href: "/actions", label: "Actions", icon: "bolt" },
  { href: "/ideas", label: "Ideas", icon: "search" },
  { href: "/company/NVDA", label: "Company", icon: "chart" },
  { href: "/accounts", label: "Accounts", icon: "link" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="top">
      <div className="wrap topbar">
        <Link href="/" className="logo">
          <span className="mark" />
          Northstar
        </Link>
        <nav className="tabs">
          {tabs.map((t) => {
            const on = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href.split("/").slice(0, 2).join("/"));
            return (
              <Link key={t.href} href={t.href} className={on ? "on" : ""}>
                <Icon name={t.icon} />
                {t.label}
              </Link>
            );
          })}
        </nav>
        <span className="spacer" />
        <span className="chip good">
          <Icon name="check" className="g" style={{ width: 13, height: 13 }} />3 accounts live
        </span>
        <span className="avatar" />
      </div>
    </header>
  );
}
