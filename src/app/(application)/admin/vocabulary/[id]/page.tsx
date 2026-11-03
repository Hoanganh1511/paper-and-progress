import { notFound } from "next/navigation";
import { VocabularyEditor } from "@/features/vocabulary-admin";

export default async function Page({
  params,
}: PageProps<"/admin/vocabulary/[id]">) {
  const { id } = await params;
  const wordId = Number(id);
  if (!Number.isInteger(wordId) || wordId < 1) notFound();
  return <VocabularyEditor id={wordId} />;
}
