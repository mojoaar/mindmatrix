"use client";

import { usePathname } from "next/navigation";
import { usePrism } from "@/hooks/use-prism";

export function DocsPrismHighlight({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  usePrism([pathname]);

  return <>{children}</>;
}
