"use client";

import { useState, type FormEvent } from "react";
import { Volume2 } from "lucide-react";
import {
  Alert,
  Button,
  FormField,
  IconButton,
  Input,
  Text,
} from "@/design-system";
import { isSingleWord } from "../display";
import { canSpeak, speakEnglish } from "../speech";

export interface PhraseFormValues {
  phrase: string;
  meaning: string;
  sampleSentence: string;
}

export interface PhraseFormProps {
  initial?: Partial<PhraseFormValues>;
  /** The English meaning of a lesson phrase, shown next to the meaning field for reference only. */
  referenceMeaning?: string;
  submitLabel: string;
  /** Resolves to an error message to show, or undefined when it worked. */
  onSubmit: (values: PhraseFormValues) => Promise<string | undefined>;
  onCancel: () => void;
}

/**
 * Adds or edits a phrase of the notebook. The meaning starts empty on purpose:
 * writing it in your own words is part of learning the phrase.
 */
export function PhraseForm({
  initial,
  referenceMeaning,
  submitLabel,
  onSubmit,
  onCancel,
}: PhraseFormProps) {
  const [phrase, setPhrase] = useState(initial?.phrase ?? "");
  const [meaning, setMeaning] = useState(initial?.meaning ?? "");
  const [sampleSentence, setSampleSentence] = useState(
    initial?.sampleSentence ?? "",
  );
  const [hasTried, setHasTried] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const phraseError =
    hasTried && !phrase.trim() ? "Hãy nhập cụm từ." : undefined;
  const meaningError =
    hasTried && !meaning.trim() ? "Hãy tự viết nghĩa hoặc gợi nhớ." : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasTried(true);
    if (!phrase.trim() || !meaning.trim()) return;
    setIsSaving(true);
    setError(undefined);
    const message = await onSubmit({
      phrase: phrase.trim(),
      meaning: meaning.trim(),
      sampleSentence: sampleSentence.trim(),
    });
    setIsSaving(false);
    if (message) setError(message);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised"
    >
      <FormField
        label="Cụm từ"
        required
        error={phraseError}
        description="Học cả cụm, không học từ đơn. Ví dụ: meet a deadline."
      >
        <Input
          value={phrase}
          autoComplete="off"
          lang="en"
          placeholder="meet a deadline"
          onChange={(event) => setPhrase(event.target.value)}
          rightAddon={
            canSpeak() && phrase.trim() ? (
              <IconButton
                icon={Volume2}
                variant="ghost"
                size="compact"
                aria-label="Nghe phát âm cụm từ"
                onClick={() => speakEnglish(phrase)}
              />
            ) : undefined
          }
        />
      </FormField>
      {isSingleWord(phrase) && (
        <Alert variant="info">
          Hãy thử học cả cụm, ví dụ “meet a deadline” thay vì “deadline”.
        </Alert>
      )}

      <FormField
        label="Nghĩa / gợi nhớ"
        required
        error={meaningError}
        description="Tự viết bằng lời của bạn, tiếng Việt hay tiếng Anh đều được."
      >
        <Input
          value={meaning}
          autoComplete="off"
          placeholder="kịp hạn chót"
          onChange={(event) => setMeaning(event.target.value)}
        />
      </FormField>
      {referenceMeaning && (
        <Text size="body-sm" color="secondary">
          Nghĩa trong bài: {referenceMeaning}
        </Text>
      )}

      <FormField label="Câu mẫu (tuỳ chọn)">
        <Input
          value={sampleSentence}
          autoComplete="off"
          lang="en"
          placeholder="We need to meet the deadline by Friday."
          onChange={(event) => setSampleSentence(event.target.value)}
        />
      </FormField>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" variant="accent" isLoading={isSaving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
