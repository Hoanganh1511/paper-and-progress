"use client";

import { useEffect, useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Alert,
  Button,
  FormField,
  Input,
  PasswordInput,
  Stack,
  Text,
} from "@/design-system";
import {
  disableTotp,
  enableTotp,
  getTotpEnabled,
  regenerateRecoveryCodes,
  setupTotp,
  type TotpSetup,
} from "../totpApi";
import { FormStatus, type FormStatusValue } from "./FormStatus";

type Step =
  | { name: "loading" }
  | { name: "off" }
  | { name: "scan"; setup: TotpSetup }
  | { name: "codes"; codes: string[] }
  | { name: "on" }
  | { name: "disable" }
  | { name: "regenerate" };

const CODE_PATTERN = /^\d{6}$/;

function errorStatus(error: unknown): FormStatusValue {
  return {
    kind: "error",
    message: error instanceof Error ? error.message : "Có lỗi xảy ra.",
  };
}

interface CodeFormProps {
  submitLabel: string;
  description?: string;
  /** Also ask for the account password (needed to switch 2FA off). */
  withPassword?: boolean;
  onSubmit: (code: string, password: string) => Promise<void>;
  onCancel: () => void;
}

/** One 6-digit code field, used to confirm each 2FA change. */
function CodeForm({
  submitLabel,
  description,
  withPassword = false,
  onSubmit,
  onCancel,
}: CodeFormProps) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<FormStatusValue>();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(undefined);
    if (!CODE_PATTERN.test(code)) {
      setError("Nhập đủ 6 số.");
      return;
    }
    setError(undefined);
    setIsSaving(true);
    try {
      await onSubmit(code, password);
    } catch (caught) {
      setStatus(errorStatus(caught));
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        label="Mã xác thực"
        description={description ?? "Mã 6 số từ ứng dụng xác thực của bạn."}
        error={error}
        required
      >
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        />
      </FormField>
      {withPassword && (
        <FormField
          label="Mật khẩu"
          description="Bỏ trống nếu bạn đăng nhập bằng Google, Facebook hoặc GitHub."
        >
          <PasswordInput
            autoComplete="current-password"
            toggleLabel="Hiện mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
      )}
      <FormStatus status={status} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" isLoading={isSaving}>
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}

/** "Xác thực hai bước": turn 2FA on with a QR code, turn it off, or get new recovery codes. */
export function TwoFactorSection() {
  const [step, setStep] = useState<Step>({ name: "loading" });
  const [status, setStatus] = useState<FormStatusValue>();
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getTotpEnabled()
      .then((isOn) => {
        if (isCurrent) setStep(isOn ? { name: "on" } : { name: "off" });
      })
      .catch((error) => {
        if (!isCurrent) return;
        setStatus(errorStatus(error));
        setStep({ name: "off" });
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  async function startSetup() {
    setIsBusy(true);
    setStatus(undefined);
    try {
      setStep({ name: "scan", setup: await setupTotp() });
    } catch (error) {
      setStatus(errorStatus(error));
    } finally {
      setIsBusy(false);
    }
  }

  if (step.name === "loading") {
    return (
      <Text role="status" color="secondary">
        Đang tải...
      </Text>
    );
  }

  if (step.name === "off") {
    return (
      <Stack gap={3} align="start">
        <Text size="body-md" color="secondary">
          Xác thực hai bước đang tắt. Bật để yêu cầu thêm mã từ ứng dụng xác
          thực mỗi khi đăng nhập.
        </Text>
        <FormStatus status={status} />
        <Button variant="accent" isLoading={isBusy} onClick={startSetup}>
          Bật xác thực hai bước
        </Button>
      </Stack>
    );
  }

  if (step.name === "scan") {
    return (
      <Stack gap={4}>
        <Text size="body-md">
          Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Authy...),
          rồi nhập mã 6 số nó hiển thị.
        </Text>
        <div className="w-fit rounded-standard border-2 border-border-strong bg-white p-3">
          <QRCodeSVG
            value={step.setup.otpauthUri}
            size={176}
            title="Mã QR thiết lập xác thực hai bước"
          />
        </div>
        {step.setup.secret && (
          <Text size="body-sm" color="secondary">
            Không quét được? Nhập khoá này:{" "}
            <code className="font-mono break-all">{step.setup.secret}</code>
          </Text>
        )}
        <CodeForm
          submitLabel="Xác nhận và bật"
          onSubmit={async (code) => {
            setStep({ name: "codes", codes: await enableTotp(code) });
          }}
          onCancel={() => setStep({ name: "off" })}
        />
      </Stack>
    );
  }

  if (step.name === "codes") {
    return (
      <Stack gap={4} align="start">
        <Alert variant="warning">
          Lưu các mã khôi phục này ở nơi an toàn. Mỗi mã chỉ dùng được một lần
          và sẽ không hiển thị lại. Dùng chúng để đăng nhập nếu bạn mất ứng dụng
          xác thực.
        </Alert>
        <ul
          aria-label="Mã khôi phục"
          className="text-body-md grid grid-cols-2 gap-2 font-mono"
        >
          {step.codes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <Button variant="primary" onClick={() => setStep({ name: "on" })}>
          Tôi đã lưu các mã này
        </Button>
      </Stack>
    );
  }

  if (step.name === "disable") {
    return (
      <CodeForm
        submitLabel="Tắt xác thực hai bước"
        withPassword
        onSubmit={async (code, password) => {
          await disableTotp(code, password);
          setStatus({ kind: "success", message: "Đã tắt xác thực hai bước." });
          setStep({ name: "off" });
        }}
        onCancel={() => setStep({ name: "on" })}
      />
    );
  }

  if (step.name === "regenerate") {
    return (
      <CodeForm
        submitLabel="Tạo mã khôi phục mới"
        description="Mã 6 số từ ứng dụng xác thực. Các mã khôi phục cũ sẽ không dùng được nữa."
        onSubmit={async (code) => {
          setStep({
            name: "codes",
            codes: await regenerateRecoveryCodes(code),
          });
        }}
        onCancel={() => setStep({ name: "on" })}
      />
    );
  }

  return (
    <Stack gap={3} align="start">
      <Text size="body-md" color="secondary">
        Xác thực hai bước đang bật.
      </Text>
      <FormStatus status={status} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setStep({ name: "regenerate" })}
        >
          Tạo lại mã khôi phục
        </Button>
        <Button variant="outline" onClick={() => setStep({ name: "disable" })}>
          Tắt xác thực hai bước
        </Button>
      </div>
    </Stack>
  );
}
