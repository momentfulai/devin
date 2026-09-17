import type { SVGProps } from "react";

const paths: Record<string, React.ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </>
  ),
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
    </>
  ),
  up: (
    <>
      <path d="m4 16 6-6 4 4 6-7" />
      <path d="M15 7h5v5" />
    </>
  ),
  down: (
    <>
      <path d="m4 8 6 6 4-4 6 7" />
      <path d="M15 17h5v-5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 3 20h18z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
      <path d="M14.5 10a2.5 2.5 0 1 0 0 4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="m6 6 2.5 2.5" />
      <path d="m15.5 15.5 2.5 2.5" />
      <path d="m18 6-2.5 2.5" />
      <path d="M8.5 15.5 6 18" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16" />
      <path d="M5 20h14" />
      <path d="m5 9-3 5h6z" />
      <path d="m19 9-3 5h6z" />
      <path d="M5 9h14" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  check: <path d="m5 12 5 5L19 7" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4a14 14 0 0 1 0 16a14 14 0 0 1 0-16" />
    </>
  ),
  send: (
    <>
      <path d="M4 12h14" />
      <path d="m12 6 6 6-6 6" />
    </>
  ),
};

export type IconName = keyof typeof paths;

export function Icon({
  name,
  className = "",
  ...rest
}: { name: IconName; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={`icon ${className}`} aria-hidden {...rest}>
      {paths[name]}
    </svg>
  );
}
