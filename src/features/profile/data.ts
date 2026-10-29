import {
  Activity,
  Briefcase,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  Link2,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from "lucide-react";
import type {
  ProfileOverview,
  ProfileTab,
  ProfileTabId,
  TabSection,
} from "./types";

/** Where every "edit" action on the profile page leads. */
export const SETTINGS_HREF = "/settings";

const ALL_TABS: Record<ProfileTabId, ProfileTab> = {
  overview: { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  personal: { id: "personal", label: "Chỉnh sửa", icon: User },
  security: { id: "security", label: "Bảo mật", icon: ShieldCheck },
  preferences: {
    id: "preferences",
    label: "Tùy chọn",
    icon: SlidersHorizontal,
  },
  connected: { id: "connected", label: "Tài khoản liên kết", icon: Link2 },
  billing: { id: "billing", label: "Gói & Thanh toán", icon: CreditCard },
  professional: { id: "professional", label: "Chuyên môn", icon: Briefcase },
  activity: { id: "activity", label: "Hoạt động", icon: Activity },
  content: { id: "content", label: "Nội dung & Dữ liệu", icon: FolderOpen },
};

/** `/profile`: what other people (and you) see about the member. */
export const PROFILE_TABS: ProfileTab[] = [
  ALL_TABS.overview,
  ALL_TABS.professional,
  ALL_TABS.activity,
  ALL_TABS.content,
];

/** `/settings`: everything the member can change about the account. */
export const SETTINGS_TABS: ProfileTab[] = [
  ALL_TABS.personal,
  ALL_TABS.security,
  ALL_TABS.preferences,
  ALL_TABS.connected,
  ALL_TABS.billing,
];

/** Placeholder content until the profile API exists. */
export const PROFILE_OVERVIEW: ProfileOverview = {
  memberSince: "15/03/2026",
  headline: "Frontend Developer • Học mỗi ngày",
  timezone: "GMT+7",
  phone: "0901 234 567",
  location: "Hà Nội, Việt Nam",
  bio: "Đang học backend và luyện tiếng Anh mỗi ngày. Thích xây những sản phẩm nhỏ nhưng dùng được thật.",
  quickInfo: [
    { label: "Ngày sinh", value: "12/08/1996" },
    { label: "Giới tính", value: "Nam" },
    { label: "Vị trí", value: "Frontend Developer" },
    { label: "Múi giờ", value: "GMT+7 (Hà Nội)" },
    { label: "Ngôn ngữ", value: "Tiếng Việt" },
  ],
  interests: ["Web", "Backend", "IELTS", "Thiết kế"],
  linkedAccounts: [
    { provider: "Google", isLinked: true, handle: "anhht.fe@gmail.com" },
    { provider: "GitHub", isLinked: true, handle: "@hoanganh" },
    { provider: "Facebook", isLinked: false },
    { provider: "LinkedIn", isLinked: false },
  ],
  quote: {
    lines: [
      "Mỗi ngày tiến một chút,",
      "rồi một ngày bạn sẽ ngạc nhiên",
      "vì mình đã đi xa đến đâu.",
    ],
  },
  skills: ["Next.js", "TypeScript", "React", "Tailwind CSS", "Node.js"],
  certificates: [
    { name: "Meta Front-End Developer", issuer: "Coursera", year: 2025 },
    { name: "IELTS Academic 7.0", issuer: "British Council", year: 2024 },
  ],
  plan: {
    name: "Free Plan",
    description: "Đủ để bắt đầu học và theo dõi tiến độ mỗi ngày.",
    features: [
      { label: "Nhật ký học tập", isIncluded: true },
      { label: "Bookmark không giới hạn", isIncluded: true },
      { label: "Xuất dữ liệu", isIncluded: false },
      { label: "Phân tích tiến độ nâng cao", isIncluded: false },
    ],
  },
  streak: {
    days: 12,
    week: [
      { label: "T2", status: "done" },
      { label: "T3", status: "done" },
      { label: "T4", status: "missed" },
      { label: "T5", status: "done" },
      { label: "T6", status: "done" },
      { label: "T7", status: "today" },
      { label: "CN", status: "upcoming" },
    ],
    message: "Giữ nhịp nhé! Hôm nay chỉ cần một bài học nhỏ.",
  },
  stats: [
    { label: "Dự án", value: "6" },
    { label: "Nhật ký", value: "48" },
    { label: "Bài viết", value: "9" },
    { label: "Khóa học", value: "4" },
    { label: "Kỹ năng", value: "14" },
    { label: "Điểm XP", value: "2.340" },
  ],
  weekMetrics: [
    { label: "Buổi học", value: "3/5" },
    { label: "Giờ học", value: "4,5" },
    { label: "Từ vựng mới", value: "24" },
    { label: "Bài hoàn thành", value: "5" },
  ],
  weeklyGoal: { percent: 60, label: "3/5 buổi học tuần này" },
  recentActivity: [
    {
      id: "r1",
      kind: "lesson",
      action: "Hoàn thành bài học",
      title: "Backend: JWT & Refresh Token",
      time: "Hôm nay, 09:30",
      href: "/goals/tech/backend-tutor",
    },
    {
      id: "r2",
      kind: "diary",
      action: "Viết nhật ký tiếng Anh",
      title: "Introduce a Project",
      time: "Hôm qua, 21:15",
      href: "/goals/english/diary",
    },
    {
      id: "r3",
      kind: "bookmark",
      action: "Lưu bookmark",
      title: "What is new in React 19",
      time: "2 ngày trước",
      href: "/bookmarks",
    },
    {
      id: "r4",
      kind: "devlog",
      action: "Cập nhật devlog",
      title: "Auth System — Phase 1",
      time: "3 ngày trước",
      href: "/devlog",
    },
  ],
  goals: [
    { id: "g1", label: "Hoàn thành 2 bài Backend", isDone: true },
    { id: "g2", label: "Luyện nghe 30 phút", isDone: true },
    { id: "g3", label: "Viết 1 bài nhật ký", isDone: false },
  ],
  badges: [
    { id: "b1", name: "Khởi động", emoji: "🚀" },
    { id: "b2", name: "7 ngày liên tiếp", emoji: "🔥" },
    { id: "b3", name: "Người viết", emoji: "✍️" },
    { id: "b4", name: "Mọt sách", emoji: "📚" },
    { id: "b5", name: "Bứt phá", emoji: "⚡" },
    { id: "b6", name: "Kiên trì", emoji: "🏅" },
  ],
};

interface TabContent {
  title: string;
  description: string;
  sections: TabSection[];
}

/** Sections for the tabs other than Overview. */
export const TAB_CONTENT: Record<
  Exclude<ProfileTabId, "overview">,
  TabContent
> = {
  personal: {
    title: "Thông tin cá nhân",
    description: "Thông tin cơ bản hiển thị trên hồ sơ của bạn.",
    sections: [
      { title: "Ảnh đại diện", items: ["Tải ảnh lên", "Cắt ảnh", "Xóa ảnh"] },
      {
        title: "Thông tin cơ bản",
        items: [
          "Tên hiển thị",
          "Email (đã xác minh)",
          "Số điện thoại",
          "Giới thiệu ngắn",
          "Ngày sinh",
          "Giới tính",
          "Vị trí và múi giờ",
        ],
      },
    ],
  },
  security: {
    title: "Bảo mật",
    description: "Quản lý đăng nhập và bảo vệ tài khoản.",
    sections: [
      {
        title: "Đăng nhập",
        items: [
          "Đổi email (xác minh email mới trước)",
          "Đổi mật khẩu (nhập mật khẩu cũ và mới)",
          "Xác thực hai lớp (TOTP, mã dự phòng)",
        ],
      },
      {
        title: "Thiết bị và lịch sử",
        items: [
          "Phiên đăng nhập đang hoạt động (đăng xuất từng thiết bị)",
          "Lịch sử đăng nhập (IP, thời gian, thiết bị)",
        ],
      },
      {
        title: "Vùng nguy hiểm",
        items: [
          "Tạm khóa tài khoản",
          "Xóa tài khoản vĩnh viễn (xác nhận bằng mật khẩu)",
        ],
      },
    ],
  },
  preferences: {
    title: "Tùy chọn",
    description: "Giao diện, ngôn ngữ và thông báo.",
    sections: [
      {
        title: "Hiển thị",
        items: ["Ngôn ngữ", "Giao diện (sáng / tối / hệ thống)", "Múi giờ"],
      },
      {
        title: "Thông báo",
        items: [
          "Email, push, trong ứng dụng (bật/tắt từng loại)",
          "Tần suất email tổng hợp (hằng ngày / hằng tuần / tắt)",
        ],
      },
    ],
  },
  connected: {
    title: "Tài khoản liên kết",
    description: "Đăng nhập nhanh và liên kết mạng xã hội.",
    sections: [
      {
        title: "Đăng nhập xã hội",
        items: ["Google", "GitHub", "Facebook", "Liên kết / ngắt liên kết"],
      },
      {
        title: "Hồ sơ công khai",
        items: ["Đường dẫn hồ sơ công khai", "Twitter, LinkedIn, website"],
      },
    ],
  },
  billing: {
    title: "Gói & Thanh toán",
    description: "Gói hiện tại, mức sử dụng và hóa đơn.",
    sections: [
      {
        title: "Gói",
        items: ["Gói hiện tại (Free / Pro / Enterprise)", "Nâng cấp / hạ cấp"],
      },
      {
        title: "Sử dụng và thanh toán",
        items: [
          "Dung lượng lưu trữ, lượt gọi API",
          "Lịch sử hóa đơn",
          "Phương thức thanh toán (thẻ, PayPal)",
        ],
      },
    ],
  },
  professional: {
    title: "Chuyên môn",
    description: "Nghề nghiệp, kỹ năng và chứng chỉ.",
    sections: [
      {
        title: "Công việc",
        items: ["Chức danh", "Công ty / tổ chức", "Phòng ban / nhóm"],
      },
      { title: "Năng lực", items: ["Kỹ năng (thẻ)", "Chứng chỉ"] },
    ],
  },
  activity: {
    title: "Hoạt động",
    description: "Chuỗi ngày học, thành tích và thống kê.",
    sections: [
      {
        title: "Tiến độ",
        items: [
          "Chuỗi ngày học",
          "Khóa học hoàn thành và % tiến độ",
          "Điểm XP",
        ],
      },
      {
        title: "Thành tích",
        items: ["Huy hiệu", "Biểu đồ đóng góp (heatmap)", "Ngày tham gia"],
      },
    ],
  },
  content: {
    title: "Nội dung & Dữ liệu",
    description: "Nội dung của bạn và quyền riêng tư.",
    sections: [
      {
        title: "Nội dung",
        items: ["Bài viết của tôi", "Bookmark / mục đã lưu"],
      },
      {
        title: "Dữ liệu và riêng tư",
        items: [
          "Tải xuống dữ liệu của tôi (GDPR)",
          "Hồ sơ công khai / riêng tư",
        ],
      },
    ],
  },
};
