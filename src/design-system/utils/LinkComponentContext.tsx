"use client";

import {
  createContext,
  useContext,
  type ElementType,
  type ReactNode,
} from "react";

export type LinkComponent = ElementType<{
  href: string;
  className?: string;
  children?: ReactNode;
}>;

const LinkComponentContext = createContext<LinkComponent>("a");

export interface LinkComponentProviderProps {
  /** What internal links render as: the framework's own link (e.g. next/link), so a click changes page without loading it again. */
  component: LinkComponent;
  children: ReactNode;
}

/**
 * The design system does not know the framework, so it draws links as plain
 * anchors, which load the whole page. The app puts its router's link here once,
 * and every `LinkButton` below it then navigates in the browser instead.
 */
export function LinkComponentProvider({
  component,
  children,
}: LinkComponentProviderProps) {
  return (
    <LinkComponentContext value={component}>{children}</LinkComponentContext>
  );
}

/** The link component given by the nearest provider; a plain `a` without one. */
export function useLinkComponent(): LinkComponent {
  return useContext(LinkComponentContext);
}
