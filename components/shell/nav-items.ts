import {
  Home,
  MessagesSquare,
  Search,
  Sparkles,
  Trophy,
  User,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Five items is the ceiling for a thumb-reachable tab bar, so the phone gets
 * the five journeys a student actually repeats. The rest live in the sidebar
 * on desktop and on the dashboard on mobile.
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/browse", label: "Browse", icon: Search },
  { href: "/sessions", label: "Sessions", icon: Video },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/profile", label: "You", icon: User },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/skillbot", label: "SkillBot", icon: Sparkles },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
