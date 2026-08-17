import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-surface p-4">
        <p className="mb-6 px-3 text-sm font-semibold text-gray-900">
          Project Ledger
        </p>
        <div className="flex-1">
          <SidebarNav />
        </div>
        <ThemeToggle />
        <SignOutButton />
      </aside>
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
