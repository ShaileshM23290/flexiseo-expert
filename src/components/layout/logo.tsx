import { BrandLogo } from "@/components/layout/brand-logo";

interface LogoProps {
  className?: string;
  href?: string;
}

export function Logo({ className, href = "/" }: LogoProps) {
  return <BrandLogo variant="header" className={className} href={href} />;
}
