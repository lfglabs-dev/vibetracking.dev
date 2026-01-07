import Link from "next/link";

interface LogoProps {
  asLink?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

export function Logo({ asLink = true, className = "", size = "md" }: LogoProps) {
  const logoContent = (
    <h1 className={`${sizeClasses[size]} font-black ${className}`}>
      <span className="text-[#E85A9A]">vibe</span>
      <span className="text-[#3DB06B]">tracking</span>
    </h1>
  );

  if (asLink) {
    return <Link href="/">{logoContent}</Link>;
  }

  return logoContent;
}
