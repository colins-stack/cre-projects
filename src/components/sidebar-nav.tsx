"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm font-medium ${
        active ? "bg-accent-600 text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}

export function SidebarNav() {
  return (
    <nav className="space-y-1">
      {LINKS.map((link) => (
        <NavLink key={link.href} href={link.href} label={link.label} />
      ))}
    </nav>
  );
}

export function SettingsLink() {
  return <NavLink href="/settings" label="Settings" />;
}
