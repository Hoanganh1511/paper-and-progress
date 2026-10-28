export interface HomeResource {
  id: string;
  title: string;
  description: string;
  href: string;
}

/** Documentation for the tools the project is built with. */
export const HOME_RESOURCES: HomeResource[] = [
  {
    id: "nextjs",
    title: "Next.js Docs",
    description: "App Router, caching và rendering.",
    href: "https://nextjs.org/docs",
  },
  {
    id: "react",
    title: "React",
    description: "Hướng dẫn và tài liệu tham khảo React 19.",
    href: "https://react.dev",
  },
  {
    id: "tailwind",
    title: "Tailwind CSS",
    description: "Tài liệu các utility class và theme v4.",
    href: "https://tailwindcss.com/docs",
  },
  {
    id: "nestjs",
    title: "NestJS",
    description: "Framework backend: module, guard, pipe.",
    href: "https://docs.nestjs.com",
  },
  {
    id: "prisma",
    title: "Prisma",
    description: "Schema, migration và truy vấn PostgreSQL.",
    href: "https://www.prisma.io/docs",
  },
  {
    id: "mdn",
    title: "MDN Web Docs",
    description: "Tham chiếu HTML, CSS và JavaScript.",
    href: "https://developer.mozilla.org",
  },
];
