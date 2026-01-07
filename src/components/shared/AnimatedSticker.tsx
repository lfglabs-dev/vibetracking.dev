"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

interface AnimatedStickerProps {
  src: string;
  width: number;
  height: number;
  className: string;
  delay?: number;
  scale?: number;
}

export function AnimatedSticker({
  src,
  width,
  height,
  className,
  delay = 0,
  scale = 0.85,
}: AnimatedStickerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      className={`${className} transition-transform duration-500 ${
        isVisible ? "animate-bounce-in" : "scale-0 opacity-0"
      }`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "backwards",
        "--sticker-scale": scale.toString(),
      } as CSSProperties}
    />
  );
}
