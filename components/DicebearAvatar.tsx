"use client";

import { createAvatar } from '@dicebear/core';
import * as loreleiStyle from '@dicebear/lorelei';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DicebearAvatarProps {
  seed?: string;
  name?: string;
  size?: number;
  className?: string;
}

export function DicebearAvatar({ seed, name, size = 36, className }: DicebearAvatarProps) {
  // Generate avatar from user name or email as seed
  const avatarSeed = seed || name || Math.random().toString(36).substring(7);
  
  const avatar = createAvatar(loreleiStyle, {
    seed: avatarSeed,
    size: size,
    // Customize avatar appearance
    backgroundColor: ['#b6e3f4', '#c0aede', '#d1d4f9', '#ffd5dc', '#ffdfbf'],
    // Add more customization options if needed
  });

  const svg = avatar.toString();
  // Use browser-compatible base64 encoding for SVG
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  const dataUrl = `data:image/svg+xml;base64,${base64}`;

  return (
    <Avatar className={className}>
      <AvatarImage src={dataUrl} alt={name || "User avatar"} />
      <AvatarFallback>
        {name ? name.charAt(0).toUpperCase() : "U"}
      </AvatarFallback>
    </Avatar>
  );
}
