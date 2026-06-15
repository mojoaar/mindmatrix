"use client";

import { useState, useEffect } from "react";

interface AvatarProps {
  name: string;
  email: string;
  image?: string | null;
  size?: number;
}

const PALETTE = [
  "#88c0d0", "#5e81ac", "#bf616a", "#d08770",
  "#ebcb8b", "#a3be8c", "#b48ead", "#8fbcbb",
];

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, email, image, size = 40 }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const color = PALETTE[hashStr(name + email) % PALETTE.length];
  const initials = getInitials(name || email);

  useEffect(() => {
    setImgError(false);
  }, [image]);

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{
          borderRadius: "50%",
          objectFit: "cover",
          width: size,
          height: size,
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize: size * 0.38,
        flexShrink: 0,
        userSelect: "none",
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
