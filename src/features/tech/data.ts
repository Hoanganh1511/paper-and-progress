import type {
  TechGroup,
  TechItem,
  TechItemIcon,
  TechSubcategory,
} from "./types";

const item = (id: string, title: string, icon: TechItemIcon): TechItem => ({
  id,
  title,
  icon,
});

const sub = (
  id: string,
  label: string,
  items: TechItem[],
): TechSubcategory => ({ id, label, items });

const TECH_GROUPS: TechGroup[] = [
  {
    id: "frontend",
    label: "Frontend",
    icon: "frontend",
    subcategories: [
      sub("fe-framework", "Framework", [
        item("react", "React", "code"),
        item("vue", "Vue", "code"),
        item("angular", "Angular", "code"),
        item("svelte", "Svelte", "code"),
        item("nextjs", "Next.js", "code"),
      ]),
      sub("fe-language", "Ngôn ngữ", [
        item("javascript", "JavaScript", "terminal"),
        item("typescript", "TypeScript", "terminal"),
      ]),
      sub("fe-styling", "Giao diện và CSS", [
        item("css", "CSS", "design"),
        item("tailwind", "Tailwind CSS", "design"),
        item("sass", "Sass", "design"),
        item("styled-components", "Styled Components", "design"),
      ]),
      sub("fe-tooling", "Công cụ", [
        item("vite", "Vite", "settings"),
        item("webpack", "Webpack", "settings"),
        item("eslint", "ESLint", "settings"),
        item("prettier", "Prettier", "settings"),
      ]),
    ],
  },
  {
    id: "backend",
    label: "Backend",
    icon: "backend",
    subcategories: [
      sub("be-runtime", "Ngôn ngữ và Runtime", [
        item("nodejs", "Node.js", "terminal"),
        item("java", "Java", "terminal"),
        item("go", "Go", "terminal"),
        item("python-be", "Python", "terminal"),
        item("php", "PHP", "terminal"),
        item("dotnet", ".NET", "terminal"),
      ]),
      sub("be-framework", "Framework", [
        item("express", "Express", "server"),
        {
          ...item("nestjs", "NestJS", "server"),
          href: "/goals/tech/backend-tutor",
        },
        item("spring-boot", "Spring Boot", "server"),
        item("django", "Django", "server"),
        item("laravel", "Laravel", "server"),
      ]),
      sub("be-database", "Cơ sở dữ liệu", [
        item("postgresql", "PostgreSQL", "database"),
        item("mysql", "MySQL", "database"),
        item("mongodb", "MongoDB", "database"),
        item("redis", "Redis", "database"),
      ]),
      sub("be-api", "API và giao tiếp", [
        item("rest", "REST", "network"),
        item("graphql", "GraphQL", "network"),
        item("grpc", "gRPC", "network"),
        item("websocket", "WebSocket", "network"),
      ]),
    ],
  },
  {
    id: "devops",
    label: "DevOps và CI/CD",
    icon: "devops",
    subcategories: [
      sub("do-cicd", "CI/CD", [
        item("github-actions", "GitHub Actions", "workflow"),
        item("gitlab-ci", "GitLab CI", "workflow"),
        item("jenkins", "Jenkins", "workflow"),
        item("argocd", "ArgoCD", "workflow"),
      ]),
      sub("do-container", "Container và Orchestration", [
        item("docker", "Docker", "container"),
        item("kubernetes", "Kubernetes", "container"),
        item("helm", "Helm", "container"),
      ]),
      sub("do-iac", "Hạ tầng dưới dạng mã", [
        item("terraform", "Terraform", "settings"),
        item("ansible", "Ansible", "settings"),
        item("pulumi", "Pulumi", "settings"),
      ]),
      sub("do-monitoring", "Giám sát và log", [
        item("prometheus", "Prometheus", "chart"),
        item("grafana", "Grafana", "chart"),
        item("datadog", "Datadog", "chart"),
        item("elk", "ELK Stack", "chart"),
      ]),
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: "mobile",
    subcategories: [
      sub("mo-native", "Native", [
        item("swift", "Swift (iOS)", "mobile"),
        item("kotlin", "Kotlin (Android)", "mobile"),
      ]),
      sub("mo-cross", "Cross-platform", [
        item("react-native", "React Native", "mobile"),
        item("flutter", "Flutter", "mobile"),
        item("ionic", "Ionic", "mobile"),
      ]),
    ],
  },
  {
    id: "data",
    label: "Dữ liệu và AI",
    icon: "data",
    subcategories: [
      sub("da-processing", "Xử lý dữ liệu", [
        item("python-data", "Python", "terminal"),
        item("pandas", "Pandas", "chart"),
        item("spark", "Apache Spark", "chart"),
        item("airflow", "Airflow", "workflow"),
      ]),
      sub("da-ml", "Machine Learning", [
        item("tensorflow", "TensorFlow", "brain"),
        item("pytorch", "PyTorch", "brain"),
        item("scikit-learn", "Scikit-learn", "brain"),
      ]),
      sub("da-warehouse", "Data Warehouse và BI", [
        item("bigquery", "BigQuery", "database"),
        item("snowflake", "Snowflake", "database"),
        item("power-bi", "Power BI", "chart"),
      ]),
    ],
  },
  {
    id: "security",
    label: "Bảo mật",
    icon: "security",
    subcategories: [
      sub("se-appsec", "An toàn ứng dụng", [
        item("owasp", "OWASP Top 10", "shield"),
        item("auth", "Xác thực và phân quyền", "lock"),
        item("pentest", "Kiểm thử xâm nhập", "shield"),
      ]),
      sub("se-network", "An toàn mạng", [
        item("firewall", "Firewall", "lock"),
        item("vpn", "VPN", "lock"),
        item("zero-trust", "Zero Trust", "shield"),
      ]),
    ],
  },
  {
    id: "cloud",
    label: "Cloud và hạ tầng",
    icon: "cloud",
    subcategories: [
      sub("cl-provider", "Nhà cung cấp", [
        item("aws", "AWS", "cloud"),
        item("gcp", "Google Cloud", "cloud"),
        item("azure", "Microsoft Azure", "cloud"),
      ]),
      sub("cl-serverless", "Serverless", [
        item("lambda", "AWS Lambda", "cloud"),
        item("cloud-functions", "Cloud Functions", "cloud"),
        item("vercel", "Vercel", "cloud"),
      ]),
    ],
  },
  {
    id: "qa",
    label: "Kiểm thử (QA)",
    icon: "qa",
    subcategories: [
      sub("qa-automation", "Kiểm thử tự động", [
        item("cypress", "Cypress", "test"),
        item("playwright", "Playwright", "test"),
        item("selenium", "Selenium", "test"),
      ]),
      sub("qa-process", "Kiểm thử thủ công và quy trình", [
        item("test-case", "Viết test case", "test"),
        item("bug-tracking", "Theo dõi lỗi", "test"),
        item("qa-workflow", "Quy trình QA", "test"),
      ]),
    ],
  },
];

/**
 * The catalogue of IT knowledge groups. Static for now; replace the body with
 * a fetch and the page keeps working because it already awaits this.
 */
export async function getTechGroups(): Promise<TechGroup[]> {
  return TECH_GROUPS;
}
