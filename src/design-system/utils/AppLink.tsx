"use client";

import { type ComponentProps, type ElementType } from "react";
import { useLinkComponent } from "./LinkComponentContext";

/**
 * A link drawn with the app's own link component (see LinkComponentProvider),
 * or a plain anchor without one. It is the only client part of a `LinkButton`:
 * the button itself stays a server-friendly component, so a server page can
 * still hand it an icon, which could not cross into a client component.
 */
export function AppLink({ ref, ...props }: ComponentProps<"a">) {
  const Component = useLinkComponent() as ElementType;
  return <Component ref={ref} {...props} />;
}
