"use client";

import { useState } from "react";
import {
  Alert,
  AlertDialog,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/design-system";
import { setAdminUserRole, type AdminUser } from "../adminApi";

type Role = AdminUser["role"];

const ROLES: { value: Role; label: string; note: string }[] = [
  { value: "USER", label: "USER", note: "Đọc và tương tác với bài viết" },
  {
    value: "CREATOR",
    label: "CREATOR",
    note: "Viết và quản lý bài viết của mình",
  },
  { value: "ADMIN", label: "ADMIN", note: "Toàn quyền, gồm khu vực quản trị" },
];

export interface RoleControlProps {
  userId: string;
  role: Role;
  /** Called after the role was saved, so the page reads the user again. */
  onChanged: () => void;
}

/** Pick a role and confirm. The server refuses changing your own, and says why. */
export function RoleControl({ userId, role, onChanged }: RoleControlProps) {
  // What the admin picked. Until then the control shows the user's own role,
  // also after the page reads the user again with the new one.
  const [picked, setPicked] = useState<Role>();
  const value = picked ?? role;
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<Role>();

  async function handleSave() {
    setIsSaving(true);
    setError(undefined);
    try {
      await setAdminUserRole(userId, value);
      setSaved(value);
      setPicked(undefined);
      onChanged();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không đổi được role.",
      );
      setPicked(undefined);
    } finally {
      setIsSaving(false);
      setIsConfirming(false);
    }
  }

  const current = ROLES.find((item) => item.value === value);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={value}
          onValueChange={(next) => {
            setPicked(next as Role);
            setSaved(undefined);
          }}
          className="w-44"
        >
          <SelectTrigger aria-label="Role" />
          <SelectContent>
            {ROLES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="compact"
          variant="outline"
          disabled={value === role}
          onClick={() => setIsConfirming(true)}
        >
          Đổi role
        </Button>
      </div>
      {current && (
        <span className="text-body-sm text-text-secondary">{current.note}</span>
      )}
      {saved && (
        <Alert variant="success">
          Đã đổi sang {saved}. Có hiệu lực khi người này làm mới phiên đăng nhập
          (trong vài phút).
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      <AlertDialog
        open={isConfirming}
        title="Đổi role của user này?"
        description={`Role sẽ đổi từ ${role} sang ${value}.`}
        confirmLabel="Đổi role"
        cancelLabel="Huỷ"
        isLoading={isSaving}
        onConfirm={handleSave}
        onCancel={() => {
          setIsConfirming(false);
          setPicked(undefined);
        }}
      />
    </div>
  );
}
