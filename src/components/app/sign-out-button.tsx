"use client";

import { LogOutIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Çıkış — oturumu kapatır ve girişe döner. */
export function SignOutButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.assign("/giris");
  };

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Çıkış yap"
        title="Çıkış yap"
        onClick={handleSignOut}
      >
        <LogOutIcon />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn("justify-start", className)}
      onClick={handleSignOut}
    >
      <LogOutIcon data-icon="inline-start" />
      Çıkış yap
    </Button>
  );
}
