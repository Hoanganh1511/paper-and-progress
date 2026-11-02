"use client";

import { useState, type FormEvent } from "react";
import { Alert, Button, FormField, Text, Textarea } from "@/design-system";
import { addPhraseExample } from "../dailyGateApi";
import { PHRASE_STAGE_LABELS, formatShortDate } from "../display";
import { containsPhrase } from "../phraseMatcher";
import type { Phrase } from "../types";
import { SentenceCheck } from "./SentenceCheck";

export interface WriteStepProps {
  phrase: Phrase;
  onSaved: (phrase: Phrase) => void;
}

/** Step 2: write your own sentence with the phrase. The first one starts the review schedule. */
export function WriteStep({ phrase, onSaved }: WriteStepProps) {
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<Phrase>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!containsPhrase(phrase.phrase, text)) return;
    setIsSaving(true);
    setError(undefined);
    try {
      const result = await addPhraseExample(phrase.id, text.trim());
      setSaved(result.phrase);
      onSaved(result.phrase);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không lưu được câu này.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (saved) {
    return (
      <Alert variant="success" title="Đã lưu câu của bạn">
        Cụm từ chuyển sang “{PHRASE_STAGE_LABELS[saved.stage]}”. Lần nhớ lại đầu
        tiên: {formatShortDate(saved.nextReviewAt)}.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {phrase.sampleSentence && (
        <Text size="body-sm" color="secondary" lang="en" className="italic">
          Câu mẫu: “{phrase.sampleSentence}”
        </Text>
      )}
      <FormField
        label="Câu của bạn"
        required
        description={`Đặt một câu về chính bạn, có dùng “${phrase.phrase}”. Động từ được chia thoải mái.`}
      >
        <Textarea
          value={text}
          lang="en"
          rows={3}
          autoComplete="off"
          onChange={(event) => setText(event.target.value)}
        />
      </FormField>
      <SentenceCheck phrase={phrase.phrase} sentence={text} />
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="accent"
          isLoading={isSaving}
          disabled={!containsPhrase(phrase.phrase, text)}
        >
          Lưu câu
        </Button>
      </div>
    </form>
  );
}
