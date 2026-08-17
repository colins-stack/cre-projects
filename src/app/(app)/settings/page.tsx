import { ThemeToggle } from "@/components/theme-toggle";
import { AccentPicker } from "@/components/accent-picker";
import { ChangePasswordForm } from "@/components/change-password-form";
import { SignOutButton } from "@/components/sign-out-button";

export default function SettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Appearance
        </h2>

        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-gray-700">Theme</p>
          <ThemeToggle />
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">
            Accent color
          </p>
          <AccentPicker />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Password</h2>
        <ChangePasswordForm />
      </div>

      <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm">
        <SignOutButton />
      </div>
    </div>
  );
}
