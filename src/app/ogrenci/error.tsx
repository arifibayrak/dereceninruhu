"use client";

import { PanelError } from "@/components/app/panel-error";

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PanelError {...props} />;
}
