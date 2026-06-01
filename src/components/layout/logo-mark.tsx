import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  gradientId?: string;
}

export function LogoMark({ className, gradientId = "flexiseo-logo-bg" }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      role="img"
      aria-label="FlexiSeo Expert"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="72" y1="56" x2="440" y2="456" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C53030" />
          <stop offset="1" stopColor="#7B1414" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${gradientId})`} />
      <rect x="28" y="28" width="456" height="456" rx="96" stroke="#FFFFFF" strokeOpacity="0.14" strokeWidth="3" />
      <circle cx="214" cy="214" r="86" stroke="#FFFFFF" strokeWidth="28" />
      <rect x="168" y="236" width="24" height="52" rx="7" fill="#FFFFFF" fillOpacity="0.78" />
      <rect x="200" y="214" width="24" height="74" rx="7" fill="#FFFFFF" fillOpacity="0.92" />
      <rect x="232" y="192" width="24" height="96" rx="7" fill="#FFFFFF" />
      <path d="M278 278L358 358" stroke="#FFFFFF" strokeWidth="28" strokeLinecap="round" />
    </svg>
  );
}
