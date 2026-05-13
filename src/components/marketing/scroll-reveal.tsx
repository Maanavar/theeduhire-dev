"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { ElementType, ReactNode } from "react";

type ScrollRevealProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  variant?: "fade-up" | "scale-in";
};

export function ScrollReveal<T extends ElementType = "div">({
  as,
  children,
  className,
  delay = 0,
  threshold = 0.18,
  variant = "fade-up",
}: ScrollRevealProps<T>) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const Tag = (as ?? "div") as ElementType;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      className={clsx(
        className,
        visible
          ? variant === "scale-in"
            ? "animate-scale-in"
            : "animate-fade-up"
          : "opacity-0 translate-y-4"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
