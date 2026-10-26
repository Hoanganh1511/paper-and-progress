import {
  Compass,
  Dumbbell,
  Feather,
  FolderKanban,
  GraduationCap,
  Library,
  Map,
  Network,
  NotebookPen,
  Newspaper,
  Route,
  Settings,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import type { LauncherModule } from "./types";

/** The app's modules, in launcher order: the groups follow one another. */
export const LAUNCHER_MODULES: LauncherModule[] = [
  // Core learning
  {
    id: "my-goals",
    label: "My Goals",
    href: "/goals",
    group: "core",
    icon: Target,
  },
  {
    id: "skill-tree",
    label: "Skill Tree",
    href: "/skills",
    group: "core",
    icon: Network,
  },
  {
    id: "learning-hub",
    label: "Learning Hub",
    href: "/learn",
    group: "core",
    icon: GraduationCap,
  },
  {
    id: "learning-path",
    label: "Learning Path",
    href: "/paths",
    group: "core",
    icon: Route,
  },
  // Practice
  {
    id: "projects",
    label: "Projects",
    href: "/projects",
    group: "practice",
    icon: FolderKanban,
  },
  {
    id: "daily-log",
    label: "Daily Log",
    href: "/daily-log",
    group: "practice",
    icon: NotebookPen,
  },
  {
    id: "content",
    label: "Content",
    href: "/content",
    group: "practice",
    icon: Newspaper,
  },
  // Explore
  {
    id: "explore",
    label: "Explore",
    href: "/explore",
    group: "explore",
    icon: Compass,
  },
  {
    id: "map-view",
    label: "Map View",
    href: "/map",
    group: "explore",
    icon: Map,
  },
  {
    id: "collections",
    label: "Collections",
    href: "/collections",
    group: "explore",
    icon: Library,
  },
  // Community
  {
    id: "community",
    label: "Community",
    href: "/community",
    group: "community",
    icon: Users,
  },
  // Personal
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    group: "personal",
    icon: UserRound,
  },
  {
    id: "fitness",
    label: "Fitness",
    href: "/fitness",
    group: "personal",
    icon: Dumbbell,
  },
  {
    id: "badminton",
    label: "Badminton",
    href: "/badminton",
    group: "personal",
    icon: Feather,
  },
  // System
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    group: "system",
    icon: Settings,
  },
];
