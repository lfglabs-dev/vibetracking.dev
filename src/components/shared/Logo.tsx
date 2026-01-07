import Link from "next/link";

interface LogoProps {
  asLink?: boolean;
  className?: string;
}

export function Logo({ asLink = true, className = "" }: LogoProps) {
  const logoContent = (
    <h1 className={`text-3xl font-black ${className}`}>
      <span className="text-[#E85A9A]">vibe</span>
      <span className="text-[#3DB06B]">tracking</span>
    </h1>
  );

  if (asLink) {
    return <Link href="/">{logoContent}</Link>;
  }

  return logoContent;
}
