"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { holdings } from "@/lib/portfolio";
import { tradeable } from "@/lib/whatif";

/** Everything the person can look up: what they own first, then the rest. */
export const lookupList = () => {
  const owned = holdings
    .filter((h) => h.kind !== "cash" && h.tvSymbol)
    .map((h) => ({ symbol: h.symbol, name: h.name, owned: true }));
  const others = tradeable
    .filter((t) => !owned.some((o) => o.symbol === t.symbol))
    .map((t) => ({ symbol: t.symbol, name: t.name, owned: false }));
  return [...owned, ...others];
};

export function CompanyPicker({ active }: { active: string }) {
  const pathname = usePathname();
  const list = lookupList();
  const owned = list.filter((i) => i.owned);
  const others = list.filter((i) => !i.owned);

  const chip = (item: { symbol: string; name: string }) => {
    const on = item.symbol.toUpperCase() === active.toUpperCase() || pathname === `/company/${item.symbol}`;
    return (
      <Link key={item.symbol} href={`/company/${item.symbol}`} className={on ? "on" : ""}>
        {item.name}
      </Link>
    );
  };

  return (
    <div className="picker">
      <div className="row">
        <span className="tiny" style={{ minWidth: 86 }}>
          What you own
        </span>
        <div className="seg wrap-sm">{owned.map(chip)}</div>
      </div>
      <div className="row">
        <span className="tiny" style={{ minWidth: 86 }}>
          Others to look at
        </span>
        <div className="seg wrap-sm">{others.map(chip)}</div>
      </div>
    </div>
  );
}
