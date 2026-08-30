"use client";

export type AuthTab = "login" | "signup";

export function AuthTabs({
  active,
  onChange,
}: {
  active: AuthTab;
  onChange: (tab: AuthTab) => void;
}) {
  return (
    <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => onChange("login")}
        className={`rounded-lg py-2 text-sm font-semibold transition-all ${
          active === "login" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
      >
        Log in
      </button>
      <button
        type="button"
        onClick={() => onChange("signup")}
        className={`rounded-lg py-2 text-sm font-semibold transition-all ${
          active === "signup" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
      >
        New Account
      </button>
    </div>
  );
}
