"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

interface LinesProps {
  /** One entry per rendered line. Kept explicit so wrapping never changes
   *  the stagger — a line is a line because the design says so. */
  lines: string[];
  className?: string;
  lineClassName?: string;
  /** ms between consecutive lines */
  stagger?: number;
}

export function Lines({
  lines,
  className = "",
  lineClassName = "",
  stagger = 70,
}: LinesProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -12% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={className}>
      {lines.map((line, i) => (
        <span
          key={i}
          className={`line ${visible ? "is-in" : ""} ${lineClassName}`}
          style={{ "--i": i, animationDelay: `${i * stagger}ms` } as CSSProperties}
        >
          {line}
        </span>
      ))}
    </span>
  );
}
