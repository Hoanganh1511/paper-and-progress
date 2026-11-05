/** Where the owner can be found. Facebook and Instagram are placeholders until the real profile addresses are set here. */
export const OWNER_LINKS = {
  email: "anhht.fe@gmail.com",
  phone: "+84 969 605 812",
  phoneHref: "tel:+84969605812",
  linkedin: "https://linkedin.com/in/tuananh-hoang",
  github: "https://github.com/anhht",
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
} as const;

export interface CvEducation {
  school: string;
  degree: string;
  gpa: string;
  period: string;
  coursework: string;
}

export interface CvJob {
  title: string;
  company: string;
  period: string;
  highlights: string[];
}

export type CvProjectIcon = "tree" | "document" | "game";

export interface CvProject {
  name: string;
  description: string;
  icon: CvProjectIcon;
  year: string;
  stack: string[];
  /** Set when the project is live; the title then links to it. */
  href?: string;
}

export interface CvSkillGroup {
  title: string;
  icon: "settings" | "layers" | "database" | "wrench";
  items: string;
}

export interface CvData {
  name: string;
  role: string;
  summary: string;
  education: CvEducation;
  experience: CvJob[];
  projects: CvProject[];
  skills: CvSkillGroup[];
  achievements: { text: string; emphasis?: string }[];
}

export const CV: CvData = {
  name: "Tuấn Anh Hoàng",
  role: "Frontend Developer",
  summary:
    "A front-end developer who enjoys building meaningful web products, turning ideas into clean, user-friendly, and performant experiences.",
  education: {
    school: "Ho Chi Minh City University of Technology (HCMUT)",
    degree: "B.Sc. in Computer Science",
    gpa: "GPA: 3.32 / 4.00",
    period: "Sep 2018 – Jun 2022",
    coursework:
      "Relevant coursework: Data Structures and Algorithms, Software Engineering, Database Systems, Computer Networks.",
  },
  experience: [
    {
      title: "Frontend Developer",
      company: "Company (Current) — Ho Chi Minh City, Vietnam",
      period: "Jan 2024 – Present",
      highlights: [
        "Build and maintain web applications with Next.js (App Router), React and TypeScript, serving 50K+ monthly users.",
        "Design and implement key features such as real-time chat (PubNub), online quiz system, and content platform.",
        "Collaborate in an Agile Scrum team (daily standup, sprint planning, code review) to deliver high-quality releases.",
      ],
    },
    {
      title: "Frontend Developer",
      company: "Company — Ho Chi Minh City, Vietnam",
      period: "Aug 2022 – Dec 2023",
      highlights: [
        "Developed and delivered multiple web products (ERP, payment, CMS, landing pages) using React.js and Next.js.",
        "Integrated REST/GraphQL APIs, improved performance (Lighthouse +30), and enhanced user experience.",
        "Worked closely with backend, QA, and product team to ship features and resolve issues.",
      ],
    },
  ],
  projects: [
    {
      name: "TreeCareer — Learning & Career Social Platform",
      description:
        "A platform for learning and career development with Skill Tree, roadmap, and social feed.",
      icon: "tree",
      year: "2026",
      stack: ["Next.js", "TypeScript", "Tailwind", "Framer Motion"],
    },
    {
      name: "Paper & Progress — Tech Blog Platform",
      description:
        "A content platform with article editor (TipTap), full-text search, members-only, and scheduled publish.",
      icon: "document",
      year: "2026",
      stack: ["Next.js", "NestJS", "PostgreSQL", "Redis"],
    },
    {
      name: "ThiThu — Online Quiz & Practice Platform",
      description:
        "An online quiz and practice system with live room, real-time interaction, and result analytics.",
      icon: "game",
      year: "2025",
      stack: ["React", "NestJS", "PubNub", "Docker"],
    },
  ],
  skills: [
    {
      title: "Languages",
      icon: "settings",
      items: "TypeScript, JavaScript (ES6+), HTML, CSS",
    },
    {
      title: "Frameworks & Libraries",
      icon: "layers",
      items:
        "React, Next.js (App Router), Tailwind CSS, Framer Motion, MUI, Swiper",
    },
    {
      title: "Backend & Database",
      icon: "database",
      items: "NestJS, Prisma, PostgreSQL, Redis, GraphQL (Apollo), REST API",
    },
    {
      title: "Tools & Others",
      icon: "wrench",
      items:
        "Git, Docker, Jenkins, AWS (EC2, S3, EBS, EFS), PubNub, Claude Code, Playwright",
    },
  ],
  achievements: [
    {
      emphasis: "3+ years",
      text: " of professional experience in building and delivering web applications in various domains.",
    },
    {
      text: "Improved page performance and user experience, achieving +30 Lighthouse score on key pages.",
    },
    {
      emphasis: "Led the frontend development",
      text: " for multiple features from design to production.",
    },
  ],
};
