import { AdminForgotPasswordForm } from "@/features/auth/AdminForgotPasswordForm";
import { AuthSidePanel } from "@/features/auth/AuthSidePanel";
import { GraduationCap } from "lucide-react";
import { getAdminAuthSiteName } from "@/shared/utils/site-settings";

export const metadata = { title: "Reset Password" };

export default async function ForgotPasswordPage() {
  const siteName = await getAdminAuthSiteName();

  return (
    <div className="min-h-screen w-full flex">
      <AuthSidePanel siteName={siteName} />

      {/* Right panel — reset form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg mb-3">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">{siteName}</span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Reset password</h2>
            <p className="text-gray-500 text-sm">
              We&apos;ll send a secure reset link to the super admin&apos;s
              registered email.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <AdminForgotPasswordForm />
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Protected by {siteName} security ·{" "}
            <span className="text-brand-600 font-medium">Admin access only</span>
          </p>
        </div>
      </div>
    </div>
  );
}
