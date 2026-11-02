/** "2026-11-01T09:44:05.000Z" -> "01/11/2026". Cut from the ISO text, so the server and the browser agree whatever the time zone. */
export const formatDate = (iso: string | null | undefined) =>
  iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "";

export const authorName = (author: { displayName: string | null }) =>
  author.displayName ?? "Tác giả ẩn danh";
