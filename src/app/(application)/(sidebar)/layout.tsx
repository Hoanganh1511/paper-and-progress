import { HomeSidebar, SidebarLayout } from "@/features/home";

/**
 * The pages that share the sidebar (the home page and the knowledge library).
 * The layout stays mounted while the reader moves between them, so the sidebar
 * is not drawn again, keeps its state (the membership card has already been
 * read) and only the page beside it changes. Each page leaves out its own
 * `<main>` and sidebar, and gives its own h1.
 */
export default function SidebarGroupLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarLayout sidebar={<HomeSidebar pageTitle={false} />}>
      {children}
    </SidebarLayout>
  );
}
