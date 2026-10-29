export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** The same limits the backend enforces; returns a message, or undefined when the file is fine. */
export function validateAvatarFile(file: File): string | undefined {
  if (!AVATAR_TYPES.includes(file.type)) {
    return "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.";
  }
  if (file.size > AVATAR_MAX_BYTES) return "Ảnh tối đa 2MB.";
  return undefined;
}
