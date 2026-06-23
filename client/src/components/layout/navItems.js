import {
  BadgeCheck,
  FileText,
  GalleryVerticalEnd,
  ImagePlus,
  LayoutDashboard,
  Radar,
  Settings,
  ShieldCheck,
  Video,
} from 'lucide-react';

export const navItems = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/protect', label: 'Protect Image', icon: ImagePlus },
  { to: '/app/protect-video', label: 'Protect Video', icon: Video },
  { to: '/app/verify', label: 'Verify Image', icon: BadgeCheck },
  { to: '/app/verify-video', label: 'Verify Video', icon: ShieldCheck },
  { to: '/app/tracking', label: 'Tracking', icon: Radar },
  { to: '/app/properties', label: 'Properties', icon: GalleryVerticalEnd },
  { to: '/app/evidence', label: 'Evidence', icon: FileText },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

// Longest-prefix match so /app/properties/:id still resolves to "Properties".
export function titleForPath(pathname) {
  const match = [...navItems]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
  return match?.label || 'Overview';
}
