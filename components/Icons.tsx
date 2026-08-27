type IconProps = {
  name: "arrow" | "arrowUp" | "check" | "clock" | "globe" | "link" | "lock" | "logout" | "moon" | "spark" | "sun" | "trend" | "zap" | "external";
  size?: number;
  strokeWidth?: number;
};

export function Icon({ name, size = 18, strokeWidth = 1.8 }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  switch (name) {
    case "arrow":
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "arrowUp":
      return <svg {...common}><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
    case "globe":
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M3.7 9h16.6M3.7 15h16.6M12 3.5c2.2 2.3 3.2 5.1 3.2 8.5s-1 6.2-3.2 8.5c-2.2-2.3-3.2-5.1-3.2-8.5s1-6.2 3.2-8.5Z" /></svg>;
    case "link":
      return <svg {...common}><path d="M10 13.8a4.2 4.2 0 0 0 6.2.2l2-2a4.2 4.2 0 0 0-6-6L11 7.2" /><path d="M14 10.2a4.2 4.2 0 0 0-6.2-.2l-2 2a4.2 4.2 0 0 0 6 6l1.2-1.2" /></svg>;
    case "lock":
      return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></svg>;
    case "logout":
      return <svg {...common}><path d="M14 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3" /><path d="M10 12h10M17 8l4 4-4 4" /></svg>;
    case "moon":
      return <svg {...common}><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" /></svg>;
    case "spark":
      return <svg {...common}><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></svg>;
    case "sun":
      return <svg {...common}><circle cx="12" cy="12" r="3.4" /><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3" /></svg>;
    case "trend":
      return <svg {...common}><path d="m4 16 5-5 3 3 7-7" /><path d="M14 7h5v5" /></svg>;
    case "zap":
      return <svg {...common}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" /></svg>;
    case "external":
      return <svg {...common}><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
  }
}

export function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M8 22.5 13 17l3.5 3.5L24 12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 12h5v5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
