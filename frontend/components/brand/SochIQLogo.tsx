"use client";

import React from "react";
import Link from "next/link";

interface SochIQLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "horizontal" | "icon-only";
  theme?: "light" | "dark";
  href?: string;
  className?: string;
}

export function SochIQIcon({
  size = 28,
  theme = "light",
  className = "",
}: {
  size?: number;
  theme?: "light" | "dark";
  className?: string;
}) {
  const isDark = theme === "dark";
  const bgFill = isDark ? "#1B1B1B" : "#111111";
  const strokeColor = isDark ? "#FFFFFF" : "#FFFFFF";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="SochIQ Icon"
    >
      {/* Outer rounded container */}
      <rect width="36" height="36" rx="9" fill={bgFill} />
      
      {/* S-curve data intelligence path */}
      <path
        d="M25 11C25 11 20 10 16 13C12 16 13 20 18 21C23 22 24 25 20 27C16 29 11 27 11 27"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top data node (yellow spark) */}
      <circle cx="25" cy="11" r="2.75" fill="#FFDF00" />
      
      {/* Bottom insight node (yellow spark) */}
      <circle cx="11" cy="27" r="2.75" fill="#FFDF00" />

      {/* Center intelligence spark dot */}
      <circle cx="18" cy="19" r="1.5" fill="#FFDF00" />
    </svg>
  );
}

export default function SochIQLogo({
  size = "md",
  variant = "horizontal",
  theme = "light",
  href,
  className = "",
}: SochIQLogoProps) {
  const isDark = theme === "dark";

  const sizeConfig = {
    sm: { icon: 24, text: "text-lg", badge: "text-[9px]" },
    md: { icon: 30, text: "text-xl", badge: "text-[10px]" },
    lg: { icon: 38, text: "text-2xl", badge: "text-xs" },
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <SochIQIcon size={sizeConfig.icon} theme={theme} />
      {variant === "horizontal" && (
        <div className="flex items-baseline gap-1 select-none">
          <span
            className={`font-heading font-extrabold tracking-tight ${sizeConfig.text} ${
              isDark ? "text-white" : "text-charcoal"
            }`}
          >
            Soch<span className="text-[#FFDF00] ml-0.5">IQ</span>
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

