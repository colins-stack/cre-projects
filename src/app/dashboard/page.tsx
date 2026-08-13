import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <SignOutButton />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">
            Logged in as <span className="font-medium">{user?.email}</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Auth is working. Stat cards, Needs Attention, and Upcoming
            sections come next.
          </p>
        </div>
      </div>
    </div>
  );
}
