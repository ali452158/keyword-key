"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User as UserIcon, Mail } from "lucide-react"

/**
 * Compact user menu shown in the header when authenticated. Displays the
 * user's avatar (initials) with a dropdown for email + sign-out.
 */
export function UserMenu() {
  const { data: session } = useSession()

  if (!session?.user) return null

  const name = session.user.name ?? session.user.email ?? "مستخدم"
  const email = session.user.email ?? ""
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0"
          aria-label="حساب المستخدم"
        >
          <Avatar className="h-9 w-9 bg-gradient-brand text-white">
            <AvatarFallback className="bg-gradient-brand text-white font-bold text-xs">
              {initials || <UserIcon className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm">{name}</span>
          {email && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-normal">
              <Mail className="w-3 h-3" />
              {email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
