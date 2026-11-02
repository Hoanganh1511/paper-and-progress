"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Skeleton,
  Text,
  buttonVariants,
  cn,
} from "@/design-system";
import { loginHref, useAuth } from "@/features/auth";
import { useMembershipEvents } from "../useMembershipEvents";
import {
  cancelMyMembershipOrder,
  createMembershipOrder,
  getMembershipPlans,
  getMyMembership,
  getMyMembershipOrders,
  type MembershipOrder,
  type MembershipPlanId,
  type MembershipPlans,
  type MembershipStatus,
} from "../membershipApi";

const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });
const money = new Intl.NumberFormat("vi-VN");

const time = new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" });

/** How often a waiting order is read again on its own. */
const POLL_MS = 30_000;

interface Note {
  variant: "info" | "success";
  text: string;
}

const BENEFITS = [
  "Đọc toàn bộ các bài viết chỉ cho xem trước 30%.",
  "Đọc các bài viết dành riêng cho hội viên.",
];

interface Loaded {
  status: MembershipStatus;
  plans: MembershipPlans;
  /** The order still waiting for money, if any. */
  waiting?: MembershipOrder;
}

function PaymentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4">
      <Text as="span" color="secondary">
        {label}
      </Text>
      <Text as="span" weight="semibold" className="font-mono">
        {value}
      </Text>
    </div>
  );
}

/** The QR code and the details to type in, for an order that is waiting for money. */
function PayPanel({
  order,
  isBusy,
  onRefresh,
  onCancel,
}: {
  order: MembershipOrder;
  isBusy: boolean;
  onRefresh: () => void;
  onCancel: () => void;
}) {
  const { payment } = order;
  return (
    <Card className="gap-4" aria-label="Thanh toán chuyển khoản">
      <Text as="h2" size="heading-md" font="display">
        Chuyển khoản để hoàn tất
      </Text>
      <div className="flex flex-col gap-4 sm:flex-row">
        {payment && (
          <Image
            src={payment.qrUrl}
            alt={`Mã QR chuyển ${money.format(order.amount)} đồng, nội dung ${order.code}`}
            width={240}
            height={300}
            unoptimized
            className="h-auto w-60 shrink-0 self-center rounded-standard border-2 border-border-strong bg-white"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {payment && (
            <>
              <PaymentRow label="Chủ tài khoản" value={payment.accountName} />
              <PaymentRow label="Số tài khoản" value={payment.accountNo} />
            </>
          )}
          <PaymentRow
            label="Số tiền"
            value={`${money.format(order.amount)} đ`}
          />
          <PaymentRow label="Nội dung chuyển khoản" value={order.code} />
          <Alert variant="warning">
            Nhập đúng số tiền và nội dung chuyển khoản. Hội viên được kích hoạt
            tự động khi tiền về, thường trong vài phút; nếu chuyển thiếu hoặc
            sai nội dung, chủ web sẽ đối chiếu thủ công.
          </Alert>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" disabled={isBusy} onClick={onRefresh}>
          Tôi đã chuyển, kiểm tra lại
        </Button>
        <Button variant="outline" disabled={isBusy} onClick={onCancel}>
          Huỷ đơn
        </Button>
      </div>
    </Card>
  );
}

/** What a check found: still waiting, paid (now a member), or the order is gone. */
function describeCheck(next: Loaded): Note {
  if (next.waiting) {
    return {
      variant: "info",
      text: `Lúc ${time.format(new Date())}: chưa thấy xác nhận thanh toán. Hệ thống tự kích hoạt hội viên khi nhận được tiền, thường trong vài phút. Trang sẽ tự cập nhật, bạn không cần chuyển lại tiền.`,
    };
  }
  if (next.status.isMember) {
    return {
      variant: "success",
      text: "Đã nhận được tiền. Hội viên của bạn đã được kích hoạt, cảm ơn bạn!",
    };
  }
  return {
    variant: "info",
    text: "Đơn này không còn chờ thanh toán. Bạn có thể chọn gói để tạo đơn mới.",
  };
}

/** What membership gives, how to get it by bank transfer, and whether the signed-in reader has it. */
export function MembershipView() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [loaded, setLoaded] = useState<Loaded>();
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [note, setNote] = useState<Note>();
  const [isBusy, setIsBusy] = useState(false);

  const load = useCallback(async (): Promise<Loaded> => {
    const [status, plans, orders] = await Promise.all([
      getMyMembership(),
      getMembershipPlans(),
      getMyMembershipOrders(),
    ]);
    return {
      status,
      plans,
      waiting: orders.find((order) => order.status === "PENDING"),
    };
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let isCurrent = true;
    load()
      .then((data) => isCurrent && setLoaded(data))
      .catch(
        () =>
          isCurrent && setError("Không tải được trạng thái hội viên của bạn."),
      );
    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, isLoading, load]);

  async function run(action: () => Promise<unknown>) {
    setIsBusy(true);
    setActionError(undefined);
    try {
      await action();
      setLoaded(await load());
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Có lỗi xảy ra.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  /**
   * The owner confirms a transfer by hand, so most of the time the answer to
   * "have you got my money?" is "not yet". Say that, with the time, so the
   * button visibly did something; say so too when it was confirmed meanwhile.
   */
  async function check() {
    setIsBusy(true);
    setActionError(undefined);
    setNote(undefined);
    try {
      const next = await load();
      setLoaded(next);
      setNote(describeCheck(next));
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Chưa kiểm tra được. Bạn thử lại nhé.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  const hasWaitingOrder = loaded?.waiting !== undefined;
  // The server says at once when the money arrived; the timer below is the fallback.
  useMembershipEvents(hasWaitingOrder, () => void check());
  useEffect(() => {
    if (!hasWaitingOrder) return;
    let isCurrent = true;
    // Quietly: only a change is worth telling the reader about.

    const timer = setInterval(() => {
      load()
        .then((next) => {
          if (!isCurrent || next.waiting) return;
          setLoaded(next);
          setNote(describeCheck(next));
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => {
      isCurrent = false;
      clearInterval(timer);
    };
  }, [hasWaitingOrder, load]);

  const choose = (plan: MembershipPlanId) =>
    run(() => createMembershipOrder(plan));

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card className="gap-4">
        <Text as="h2" size="heading-md" font="display">
          Quyền lợi hội viên
        </Text>
        <ul className="flex flex-col gap-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <Check aria-hidden="true" size={18} className="mt-1 shrink-0" />
              <Text>{benefit}</Text>
            </li>
          ))}
        </ul>
      </Card>

      {isLoading || (isAuthenticated && !loaded && !error) ? (
        <div aria-busy="true">
          <span role="status" className="sr-only">
            Đang tải
          </span>
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !isAuthenticated ? (
        <Card className="items-start gap-3">
          <Text>Đăng nhập để xem trạng thái và đăng ký hội viên.</Text>
          <Link
            href={loginHref(pathname)}
            className={cn(buttonVariants({ variant: "primary" }))}
          >
            Đăng nhập
          </Link>
        </Card>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        loaded && (
          <>
            <Card className="items-start gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={loaded.status.isMember ? "success" : "default"}>
                  {loaded.status.isMember
                    ? "Bạn là hội viên"
                    : "Bạn chưa là hội viên"}
                </Badge>
                {loaded.status.expiresAt && (
                  <Text as="span" size="body-sm" color="secondary">
                    {loaded.status.isMember ? "Hết hạn" : "Đã hết hạn"} ngày{" "}
                    {date.format(new Date(loaded.status.expiresAt))}
                  </Text>
                )}
              </div>
              <Link
                href="/membership/orders"
                className="text-body-sm underline underline-offset-4"
              >
                Lịch sử giao dịch
              </Link>
            </Card>

            {actionError && <Alert variant="danger">{actionError}</Alert>}
            {note && (
              <Alert variant={note.variant} role="status">
                {note.text}
              </Alert>
            )}

            {loaded.waiting ? (
              <PayPanel
                order={loaded.waiting}
                isBusy={isBusy}
                onRefresh={check}
                onCancel={() =>
                  run(() => cancelMyMembershipOrder(loaded.waiting!.id))
                }
              />
            ) : !loaded.plans.isOpen ? (
              <Alert variant="info">
                Đăng ký hội viên chưa mở. Bạn quay lại sau nhé.
              </Alert>
            ) : (
              <Card className="gap-4">
                <Text as="h2" size="heading-md" font="display">
                  {loaded.status.isMember ? "Gia hạn hội viên" : "Chọn gói"}
                </Text>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {loaded.plans.plans.map((plan) => (
                    <li
                      key={plan.plan}
                      className="flex flex-col items-start gap-2 rounded-standard border-2 border-border-strong p-4"
                    >
                      <Text weight="bold" className="font-display">
                        {plan.label}
                      </Text>
                      <Text size="heading-md" font="display">
                        {money.format(plan.amount)} đ
                      </Text>
                      <Button
                        variant="primary"
                        disabled={isBusy}
                        onClick={() => choose(plan.plan)}
                        aria-label={`Chọn gói ${plan.label}`}
                      >
                        Chọn gói
                      </Button>
                    </li>
                  ))}
                </ul>
                <Text size="body-sm" color="secondary">
                  Thanh toán bằng chuyển khoản ngân hàng qua mã VietQR.
                </Text>
              </Card>
            )}
          </>
        )
      )}
    </div>
  );
}
