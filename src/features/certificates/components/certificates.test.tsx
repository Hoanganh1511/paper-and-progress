import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { CertificateSummary } from "../types";

expect.extend(toHaveNoViolations);

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));
vi.mock("@/features/auth", () => ({ authedApi: {} }));

const api = vi.hoisted(() => ({
  listCertificates: vi.fn(),
}));
vi.mock("../certificatesApi", () => api);

import { CertificateForm } from "./CertificateForm";
import { CertificatesDashboard } from "./CertificatesDashboard";

const item = (over: Partial<CertificateSummary>): CertificateSummary => ({
  id: "c1",
  name: "AWS Certified Solutions Architect",
  issuer: "Amazon Web Services",
  status: "ACHIEVED",
  imageUrl: null,
  credentialId: null,
  score: null,
  issuedAt: "2026-09-15",
  expiresAt: "2029-09-15",
  startDate: null,
  targetDate: null,
  progress: 0,
  studyList: null,
  ...over,
});

const certificates = [
  item({}),
  item({
    id: "c2",
    name: "React Developer Certification",
    issuer: "Meta",
    status: "STUDYING",
    issuedAt: null,
    expiresAt: null,
    startDate: "2026-10-01",
    targetDate: "2026-11-30",
    progress: 70,
  }),
  item({
    id: "c3",
    name: "Google Cloud Architect",
    issuer: "Google Cloud",
    status: "PLANNED",
    issuedAt: null,
    expiresAt: null,
    startDate: "2026-12-01",
  }),
];

beforeEach(() => {
  vi.clearAllMocks();
  api.listCertificates.mockResolvedValue(certificates);
});

describe("CertificatesDashboard", () => {
  it("counts the certificates by status and lists them", async () => {
    const { container } = render(<CertificatesDashboard />);
    expect(
      await screen.findByRole("link", {
        name: "AWS Certified Solutions Architect",
      }),
    ).toHaveAttribute("href", "/certificates/c1");
    expect(
      screen.getByRole("tab", { name: /Tất cả \(3\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Đang học \(1\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Đã đạt \(1\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Kế hoạch \(1\)/ }),
    ).toBeInTheDocument();
    // a plan waits in its own section, not in the main list
    const upcoming = screen.getByRole("heading", { name: "Kế hoạch sắp tới" })
      .parentElement as HTMLElement;
    expect(
      within(upcoming).getByRole("link", { name: "Google Cloud Architect" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: /React Developer/ }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("filters by tab and by search", async () => {
    const user = userEvent.setup();
    render(<CertificatesDashboard />);
    await screen.findByRole("link", { name: /AWS Certified/ });

    await user.click(screen.getByRole("tab", { name: /Đã đạt/ }));
    expect(
      screen.getByRole("link", { name: /AWS Certified/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /React Developer/ })).toBeNull();

    await user.click(screen.getByRole("tab", { name: /Tất cả/ }));
    await user.type(screen.getByLabelText(/Tìm chứng chỉ/), "meta");
    expect(
      screen.getByRole("link", { name: /React Developer/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /AWS Certified/ })).toBeNull();

    await user.clear(screen.getByLabelText(/Tìm chứng chỉ/));
    await user.type(screen.getByLabelText(/Tìm chứng chỉ/), "zzz");
    expect(screen.getByText("Không có chứng chỉ nào khớp")).toBeInTheDocument();
  });

  it("switches to a table", async () => {
    const user = userEvent.setup();
    render(<CertificatesDashboard />);
    await screen.findByRole("link", { name: /AWS Certified/ });
    await user.click(screen.getByRole("button", { name: "Danh sách" }));
    const table = screen.getByRole("table");
    expect(within(table).getByText("70%")).toBeInTheDocument();
    expect(within(table).getByText("15/09/2026")).toBeInTheDocument();
  });

  it("invites to add the first one, and shows a failed load with a retry", async () => {
    api.listCertificates.mockResolvedValueOnce([]);
    const first = render(<CertificatesDashboard />);
    expect(
      await screen.findByText("Chưa có chứng chỉ nào"),
    ).toBeInTheDocument();
    first.unmount();

    api.listCertificates.mockRejectedValueOnce(new Error("Máy chủ bận"));
    render(<CertificatesDashboard />);
    expect(await screen.findByText("Máy chủ bận")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByRole("link", { name: /AWS Certified/ }),
    ).toBeInTheDocument();
  });
});

describe("CertificateForm", () => {
  const fill = (label: RegExp | string, text: string) =>
    userEvent.type(screen.getByLabelText(label), text);

  it("asks for the name, issuer and the date its status needs", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CertificateForm
        status="ACHIEVED"
        submitLabel="Thêm chứng chỉ"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Thêm chứng chỉ" }),
    );
    expect(screen.getByText("Nhập tên chứng chỉ.")).toBeInTheDocument();
    expect(screen.getByText("Nhập tổ chức cấp.")).toBeInTheDocument();
    expect(screen.getByText("Chọn ngày đạt.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("refuses an image link that is not http", async () => {
    const onSubmit = vi.fn();
    render(
      <CertificateForm
        status="ACHIEVED"
        initial={item({})}
        submitLabel="Lưu"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    await fill(/Ảnh chứng chỉ/, "javascript:alert(1)");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(
      screen.getByText("Link ảnh phải bắt đầu bằng http hoặc https."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("links a study list and leaves progress to its steps", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CertificateForm
        status="STUDYING"
        initial={item({
          status: "STUDYING",
          startDate: "2026-10-01",
          progress: 20,
          studyList: {
            id: "l1",
            title: "Ôn thi AWS",
            stepCount: 4,
            doneStepCount: 1,
            progress: 25,
          },
        })}
        studyLists={[
          {
            id: "l1",
            title: "Ôn thi AWS",
            description: null,
            sectionCount: 1,
            stepCount: 4,
            doneStepCount: 1,
            progress: 25,
            certificates: [],
          },
        ]}
        submitLabel="Lưu"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("slider", { name: "Tiến độ hiện tại" }),
    ).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const input = onSubmit.mock.calls[0][0];
    expect(input.studyListId).toBe("l1");
    expect(input).not.toHaveProperty("progress");
  });

  it("sends what fits the status and shows the server's complaint", async () => {
    const onSubmit = vi.fn().mockResolvedValue("Ngày không hợp lệ");
    render(
      <CertificateForm
        status="STUDYING"
        initial={item({
          status: "STUDYING",
          startDate: "2026-10-01",
          progress: 20,
        })}
        submitLabel="Lưu"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const input = onSubmit.mock.calls[0][0];
    expect(input).toMatchObject({
      status: "STUDYING",
      startDate: "2026-10-01",
      progress: 20,
    });
    expect(input).not.toHaveProperty("issuedAt");
    expect(await screen.findByText("Ngày không hợp lệ")).toBeInTheDocument();
  });
});
