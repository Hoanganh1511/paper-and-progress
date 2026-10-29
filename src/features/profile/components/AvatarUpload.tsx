"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Trash2, Upload, X } from "lucide-react";
import { Button, Inline, Stack, Text } from "@/design-system";
import { AVATAR_TYPES, validateAvatarFile } from "../avatarFile";
import { ProfileApiError } from "../profileApi";
import { FormStatus, type FormStatusValue } from "./FormStatus";

export interface AvatarUploadProps {
  avatarUrl: string | null;
  /** Letter shown while there is no picture. */
  initial: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

/**
 * Click the picture to choose a file, check the preview, then upload it.
 * Nothing is sent until "Tải lên" is pressed. "Xoá ảnh" removes the current one.
 */
export function AvatarUpload({
  avatarUrl,
  initial,
  onUpload,
  onRemove,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ file: File; previewUrl: string }>();
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<FormStatusValue>();

  // Free the preview's object URL when it is replaced or the component goes away.
  useEffect(
    () => () => {
      if (pending) URL.revokeObjectURL(pending.previewUrl);
    },
    [pending],
  );

  function handleChoose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // choosing the same file again must fire onChange
    if (!file) return;
    const problem = validateAvatarFile(file);
    if (problem) {
      setPending(undefined);
      setStatus({ kind: "error", message: problem });
      return;
    }
    setStatus(undefined);
    setPending({ file, previewUrl: URL.createObjectURL(file) });
  }

  async function run(action: () => Promise<void>, successMessage: string) {
    setIsBusy(true);
    setStatus(undefined);
    try {
      await action();
      setPending(undefined);
      setStatus({ kind: "success", message: successMessage });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof ProfileApiError
            ? error.message
            : "Có lỗi xảy ra. Thử lại sau.",
      });
    } finally {
      setIsBusy(false);
    }
  }

  const shownUrl = pending?.previewUrl ?? avatarUrl;

  return (
    <Stack gap={3}>
      <div className="flex flex-wrap items-center gap-4">
        {/* The whole picture is the file-picker button. */}
        <button
          type="button"
          aria-label="Chọn ảnh đại diện"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          className="group relative flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-pill border-2 border-border-strong bg-accent-pink font-display text-heading-xl text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-50"
        >
          {shownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a blob: preview or an external S3 URL
            <img src={shownUrl} alt="" className="size-full object-cover" />
          ) : (
            <span aria-hidden="true">{initial}</span>
          )}
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-ink/50 text-surface opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
          >
            <Camera size={24} />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleChoose}
        />
        <Stack gap={2}>
          <Text size="body-sm" color="secondary">
            JPEG, PNG hoặc WebP, tối đa 2MB. Ảnh được cắt vuông 256×256.
          </Text>
          <Inline gap={2} wrap>
            {pending ? (
              <>
                <Button
                  variant="accent"
                  leftIcon={Upload}
                  isLoading={isBusy}
                  onClick={() =>
                    run(
                      () => onUpload(pending.file),
                      "Đã cập nhật ảnh đại diện.",
                    )
                  }
                >
                  Tải lên
                </Button>
                <Button
                  variant="outline"
                  leftIcon={X}
                  disabled={isBusy}
                  onClick={() => {
                    setPending(undefined);
                    setStatus(undefined);
                  }}
                >
                  Huỷ
                </Button>
              </>
            ) : (
              avatarUrl && (
                <Button
                  variant="outline"
                  leftIcon={Trash2}
                  isLoading={isBusy}
                  onClick={() => run(onRemove, "Đã xoá ảnh đại diện.")}
                >
                  Xoá ảnh
                </Button>
              )
            )}
          </Inline>
        </Stack>
      </div>
      <FormStatus status={status} />
    </Stack>
  );
}
