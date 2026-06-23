import {
  BadgeCheck,
  FileText,
  GalleryVerticalEnd,
  ImagePlus,
  LayoutDashboard,
  Radar,
  Settings,
} from 'lucide-react';

export const navItems = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/protect', label: 'Protect', icon: ImagePlus },
  { to: '/app/verify', label: 'Verify', icon: BadgeCheck },
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
