"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  Alert,
  Button,
  FormField,
  Input,
  Stack,
  Text,
} from "@/design-system";
import { useAuth } from "@/features/auth";
import { ProfileApiError, deleteAccount } from "../profileApi";

/** The phrase to type before the account can be deleted. */
export const DELETE_CONFIRMATION = "XOA TAI KHOAN";

/** Red "Xoá tài khoản" button; the dialog asks for the phrase, then signs the user out. */
export function DeleteAccountSection() {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>();

  function close() {
    if (isDeleting) return;
    setIsOpen(false);
    setPhrase("");
    setError(undefined);
  }

  async function handleConfirm() {
    setIsDeleting(true);
    setError(undefined);
    try {
      await deleteAccount();
    } catch (failure) {
      setError(
        failure instanceof ProfileApiError
          ? failure.message
          : "Có lỗi xảy ra. Thử lại sau.",
      );
      setIsDeleting(false);
      return;
    }
    // The account is gone: sign out and go to /login (logout redirects).
    await logout();
  }

  return (
    <Stack gap={3}>
      <Text size="body-md" color="secondary">
        Tài khoản sẽ bị vô hiệu hoá và bạn sẽ bị đăng xuất ngay. Hãy chắc chắn
        trước khi tiếp tục.
      </Text>
      <div>
        <Button
          variant="destructive"
          leftIcon={Trash2}
          onClick={() => setIsOpen(true)}
        >
          Xoá tài khoản
        </Button>
      </div>
      <AlertDialog
        open={isOpen}
        variant="destructive"
        title="Xoá tài khoản?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xoá tài khoản"
        cancelLabel="Huỷ"
        isLoading={isDeleting}
        isConfirmDisabled={phrase !== DELETE_CONFIRMATION}
        onConfirm={handleConfirm}
        onCancel={close}
      >
        <Stack gap={3}>
          <FormField label={`Gõ “${DELETE_CONFIRMATION}” để xác nhận`}>
            <Input
              value={phrase}
              autoComplete="off"
              onChange={(event) => setPhrase(event.target.value)}
            />
          </FormField>
          {error && <Alert variant="danger">{error}</Alert>}
        </Stack>
      </AlertDialog>
    </Stack>
  );
}
