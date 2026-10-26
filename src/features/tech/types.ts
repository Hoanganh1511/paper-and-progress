/** Key of the icon shown on a group's tab; mapped to a component on the client. */
export type TechGroupIcon =
  | "frontend"
  | "backend"
  | "devops"
  | "mobile"
  | "data"
  | "security"
  | "cloud"
  | "qa";

/** Key of the icon in an item's tile; mapped to a component on the client. */
export type TechItemIcon =
  | "code"
  | "terminal"
  | "database"
  | "server"
  | "cloud"
  | "container"
  | "workflow"
  | "shield"
  | "lock"
  | "network"
  | "mobile"
  | "brain"
  | "chart"
  | "design"
  | "settings"
  | "test";

export interface TechItem {
  id: string;
  title: string;
  icon: TechItemIcon;
  /** When set, the whole tile links here. */
  href?: string;
}

/** A clickable sub-category within a group; switches the grid shown. */
export interface TechSubcategory {
  id: string;
  label: string;
  items: TechItem[];
}

/** A top-level knowledge group, e.g. Frontend, Backend, DevOps. */
export interface TechGroup {
  id: string;
  label: string;
  icon: TechGroupIcon;
  subcategories: TechSubcategory[];
}
