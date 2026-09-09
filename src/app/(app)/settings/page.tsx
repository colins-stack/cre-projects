import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccentPicker } from "@/components/accent-picker";
import { ChangePasswordForm } from "@/components/change-password-form";
import { DisplayNameForm } from "@/components/display-name-form";
import { SignOutButton } from "@/components/sign-out-button";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-4xl">
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

        {user && (
          <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Profile
            </h2>
            <DisplayNameForm
              userId={user.id}
              currentName={(profile as Profile | null)?.display_name ?? ""}
            />
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Password</h2>
          <ChangePasswordForm />
        </div>

        <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
