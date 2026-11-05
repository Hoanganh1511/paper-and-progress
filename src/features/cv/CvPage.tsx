import type { ReactNode } from "react";
import {
  Briefcase,
  Check,
  Database,
  Gamepad2,
  FileText,
  GraduationCap,
  Layers,
  Mail,
  Phone,
  Settings,
  SquareArrowOutUpRight,
  Code,
  Trophy,
  TreePine,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Text, cn, focusRingClasses } from "@/design-system";
import { Mascot } from "@/features/english";
import { GithubIcon, LinkedinIcon } from "./BrandIcons";
import {
  CV,
  OWNER_LINKS,
  type CvProject,
  type CvProjectIcon,
  type CvSkillGroup,
} from "./cvData";

const PROJECT_ICONS: Record<CvProjectIcon, { icon: LucideIcon; tile: string }> =
  {
    tree: { icon: TreePine, tile: "bg-accent-lime" },
    document: { icon: FileText, tile: "bg-accent-pink" },
    game: { icon: Gamepad2, tile: "bg-accent-blue" },
  };

const SKILL_ICONS: Record<CvSkillGroup["icon"], LucideIcon> = {
  settings: Settings,
  layers: Layers,
  database: Database,
  wrench: Wrench,
};

/** A date or year in a pill. */
function Period({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "lime" | "pink";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center self-start rounded-pill border-2 border-border-strong px-3 py-0.5 text-body-sm font-semibold whitespace-nowrap text-ink",
        tone === "lime" ? "bg-accent-lime" : "bg-accent-pink",
      )}
    >
      {children}
    </span>
  );
}

/** A section: a yellow tab with its icon and title, a rule running on from it, and the content in a framed box. */
function CvSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col">
      <div className="flex items-end">
        <h2 className="relative z-10 -mb-0.5 inline-flex h-11 items-center gap-2 rounded-t-standard rounded-br-standard border-2 border-border-strong bg-accent-yellow px-4 font-display text-heading-sm font-bold text-ink uppercase">
          <Icon aria-hidden="true" size={20} />
          {title}
        </h2>
        <span
          aria-hidden="true"
          className="mb-0 h-0.5 flex-1 bg-border-strong"
        />
      </div>
      <div className="rounded-standard rounded-tl-none border-2 border-border-strong bg-surface-card p-4 shadow-raised md:p-5">
        {children}
      </div>
    </section>
  );
}

function ContactLink({
  icon: Icon,
  href,
  children,
  isExternal = false,
}: {
  icon: ReactNode;
  href: string;
  children: ReactNode;
  isExternal?: boolean;
}) {
  return (
    <a
      href={href}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-sharp text-body-sm font-medium underline-offset-2 hover:underline",
        focusRingClasses,
      )}
    >
      {Icon}
      {children}
      {isExternal && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

function CvHeader() {
  const bare = (url: string) => url.replace(/^https?:\/\//, "");
  return (
    <header className="rounded-soft bg-accent-lime pr-1.5 pb-1.5">
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-soft border-2 border-border-strong bg-surface-card p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <h1 className="font-display text-heading-xl leading-tight font-bold text-ink md:text-[2.75rem]">
              {CV.name}
            </h1>
            <span className="inline-flex self-start rounded-standard border-2 border-border-strong bg-accent-lime px-3 py-1 font-display text-body-lg font-bold text-ink">
              {CV.role}
            </span>
            <Text as="p" size="body-md" className="max-w-xl">
              {CV.summary}
            </Text>
          </div>
          <div
            aria-hidden="true"
            className="hidden size-36 shrink-0 items-center justify-center rounded-pill bg-accent-lime sm:flex md:size-44"
          >
            <Mascot
              accessory="headphones"
              aria-hidden="true"
              className="size-28 md:size-36"
            />
          </div>
        </div>
        <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-1 border-t-2 border-border-strong p-0 pt-3">
          <li>
            <ContactLink
              icon={<Mail aria-hidden="true" size={18} />}
              href={`mailto:${OWNER_LINKS.email}`}
            >
              {OWNER_LINKS.email}
            </ContactLink>
          </li>
          <li>
            <ContactLink
              icon={<Phone aria-hidden="true" size={18} />}
              href={OWNER_LINKS.phoneHref}
            >
              {OWNER_LINKS.phone}
            </ContactLink>
          </li>
          <li>
            <ContactLink
              icon={<LinkedinIcon size={18} />}
              href={OWNER_LINKS.linkedin}
              isExternal
            >
              {bare(OWNER_LINKS.linkedin)}
            </ContactLink>
          </li>
          <li>
            <ContactLink
              icon={<GithubIcon size={18} />}
              href={OWNER_LINKS.github}
              isExternal
            >
              {bare(OWNER_LINKS.github)}
            </ContactLink>
          </li>
        </ul>
      </div>
    </header>
  );
}

function ProjectRow({ project }: { project: CvProject }) {
  const { icon: Icon, tile } = PROJECT_ICONS[project.icon];
  return (
    <li className="grid items-center gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)_auto] md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong text-ink",
            tile,
          )}
        >
          <Icon size={28} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Text
            as="h3"
            size="body-lg"
            weight="bold"
            className="inline-flex flex-wrap items-center gap-1.5 font-display"
          >
            {project.href ? (
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sharp underline-offset-2 hover:underline",
                  focusRingClasses,
                )}
              >
                {project.name}
                <SquareArrowOutUpRight aria-hidden="true" size={14} />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              project.name
            )}
          </Text>
          <Text as="p" size="body-sm" color="secondary">
            {project.description}
          </Text>
        </div>
      </div>
      <ul
        aria-label={`${project.name}: technologies`}
        className="m-0 flex list-none flex-wrap gap-2 p-0 md:border-l-2 md:border-border-strong md:pl-4"
      >
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded-pill border-2 border-border-strong bg-surface-sunken px-3 py-0.5 text-body-sm font-semibold"
          >
            {tech}
          </li>
        ))}
      </ul>
      <Period tone="lime">{project.year}</Period>
    </li>
  );
}

function Mountain() {
  return (
    <svg
      viewBox="0 0 120 90"
      width={120}
      height={90}
      aria-hidden="true"
      focusable="false"
      className="hidden shrink-0 md:block"
    >
      <path
        d="M4 82 L40 30 L58 54 L78 18 L116 82 Z"
        fill="var(--color-accent-lime)"
        stroke="var(--color-border-strong)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M70 30 L78 18 L86 32 L78 28 Z"
        fill="var(--color-surface-card)"
        stroke="var(--color-border-strong)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M78 18 V4"
        stroke="var(--color-border-strong)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M78 4 L96 9 L78 15 Z"
        fill="var(--color-accent-pink)"
        stroke="var(--color-border-strong)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The owner's CV, in the same neo-brutalist style as the rest of the site. */
export function CvPage() {
  return (
    <div lang="en" className="flex flex-col gap-6">
      <CvHeader />

      <CvSection icon={GraduationCap} title="Education">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Text
              as="h3"
              size="body-lg"
              weight="bold"
              className="inline-flex items-center gap-2 font-display"
            >
              <span
                aria-hidden="true"
                className="size-3.5 rounded-sharp border-2 border-border-strong bg-accent-pink"
              />
              {CV.education.school}
            </Text>
            <Period tone="lime">{CV.education.period}</Period>
          </div>
          <Text as="p" size="body-md" color="secondary">
            <em>{CV.education.degree}</em>
            <span aria-hidden="true" className="mx-3">
              |
            </span>
            {CV.education.gpa}
          </Text>
          <ul className="m-0 list-disc pl-5 text-body-md">
            <li>{CV.education.coursework}</li>
          </ul>
        </div>
      </CvSection>

      <CvSection icon={Briefcase} title="Experience">
        <ol className="m-0 flex list-none flex-col gap-6 p-0">
          {CV.experience.map((job, index) => {
            const isLast = index === CV.experience.length - 1;
            return (
              <li key={job.period} className="relative pl-9">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1 left-0 size-5 rounded-pill border-2 border-border-strong",
                    index === 0 ? "bg-surface-card" : "bg-accent-lime",
                  )}
                />
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute top-6 -bottom-6 left-[9px] w-0.5 bg-border-strong"
                  />
                )}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Text
                      as="h3"
                      size="body-lg"
                      weight="bold"
                      className="font-display"
                    >
                      {job.title}
                    </Text>
                    <Text as="p" size="body-md" color="secondary">
                      <em>{job.company}</em>
                    </Text>
                  </div>
                  <Period tone="pink">{job.period}</Period>
                </div>
                <ul className="m-0 mt-2 list-disc pl-5 text-body-md">
                  {job.highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </CvSection>

      <CvSection icon={Layers} title="Projects">
        <ul className="m-0 list-none divide-y-2 divide-border-subtle p-0">
          {CV.projects.map((project) => (
            <ProjectRow key={project.name} project={project} />
          ))}
        </ul>
      </CvSection>

      <CvSection icon={Code} title="Skills">
        <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {CV.skills.map((group, index) => {
            const Icon = SKILL_ICONS[group.icon];
            return (
              <li
                key={group.title}
                className={cn(
                  "flex flex-col gap-1.5 lg:px-4",
                  index > 0 && "lg:border-l-2 lg:border-border-subtle",
                  index === 0 && "lg:pl-0",
                )}
              >
                <Text
                  as="h3"
                  size="body-md"
                  weight="bold"
                  className="inline-flex items-center gap-2 font-display"
                >
                  <Icon aria-hidden="true" size={18} />
                  {group.title}
                </Text>
                <Text as="p" size="body-sm">
                  {group.items}
                </Text>
              </li>
            );
          })}
        </ul>
      </CvSection>

      <CvSection icon={Trophy} title="Achievements">
        <div className="flex items-center justify-between gap-4">
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {CV.achievements.map((item) => (
              <li
                key={item.text}
                className="flex items-start gap-3 text-body-md"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sharp border-2 border-border-strong bg-accent-pink text-ink"
                >
                  <Check size={14} strokeWidth={3} />
                </span>
                <span>
                  {item.emphasis && <strong>{item.emphasis}</strong>}
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
          <Mountain />
        </div>
      </CvSection>
    </div>
  );
}
