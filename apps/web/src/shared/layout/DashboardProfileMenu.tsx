"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";

export function DashboardProfileMenu({
  user,
  dashboardHref,
  isStudent,
  onLogout,
}: {
  user: {
    firstName: string;
    lastName: string;
    initials: string;
    avatar: string | null;
    role: string;
  };
  dashboardHref: string;
  isStudent: boolean;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ml-1 flex cursor-pointer items-center gap-3 rounded-full bg-white py-1 pl-1 pr-3 shadow-sm outline-none dark:bg-slate-900">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.avatar ?? ""} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {user.firstName}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.role}</p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 border-slate-200 bg-white text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {isStudent ? "Student" : "Guest"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={dashboardHref}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
          onSelect={(e) => {
            e.preventDefault();
            onLogout();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
