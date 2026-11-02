"use client";

import { useState } from "react";
import { ArrowLeft, Volume2 } from "lucide-react";
import { Badge, Button, IconButton, Text, cn } from "@/design-system";
import { PHRASE_STAGE_LABELS } from "../display";
import { canSpeak, speakEnglish } from "../speech";
import type { Phrase } from "../types";
import { RecallStep } from "./RecallStep";
import { SpeakStep } from "./SpeakStep";
import { WriteStep } from "./WriteStep";

type Mode = "recall" | "speak";

export interface PhrasePracticeProps {
  phrase: Phrase;
  /** Called after any step changed the phrase, so the list can be read again. */
  onChanged: () => void;
  onBack: () => void;
}

/**
 * Practice one phrase. A phrase without a sentence starts at step 2 (write);
 * after that the user picks between recall (step 3) and speaking (step 4).
 */
export function PhrasePractice({
  phrase: initial,
  onChanged,
  onBack,
}: PhrasePracticeProps) {
  const [phrase, setPhrase] = useState(initial);
  const [mode, setMode] = useState<Mode>(
    initial.stage === "SPEAK" ? "speak" : "recall",
  );
  // Stays on the write step once opened there, so its "saved" message is not
  // swallowed when the phrase moves on to the next stage.
  const [startedAtWrite] = useState(initial.stage === "WRITE");
  // Remount a step after it finished, so "Xong" starts it fresh.
  const [round, setRound] = useState(0);

  const update = (next: Phrase) => {
    setPhrase(next);
    onChanged();
  };
  const modes: { value: Mode; label: string }[] = [
    { value: "recall", label: "Nhớ lại" },
    { value: "speak", label: "Luyện nói" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Button variant="ghost" leftIcon={ArrowLeft} onClick={onBack}>
          Về Sổ cụm từ
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised">
        <div className="flex items-start justify-between gap-2">
          <Text
            as="h3"
            size="heading-md"
            weight="bold"
            lang="en"
            className="font-display break-words"
          >
            {phrase.phrase}
          </Text>
          {canSpeak() && (
            <IconButton
              icon={Volume2}
              variant="ghost"
              size="compact"
              aria-label={`Nghe phát âm: ${phrase.phrase}`}
              onClick={() => speakEnglish(phrase.phrase)}
            />
          )}
        </div>
        <Text size="body-md" color="secondary">
          {phrase.meaning}
        </Text>
        <div>
          <Badge
            size="sm"
            variant={phrase.stage === "MASTERED" ? "lime" : "default"}
          >
            {PHRASE_STAGE_LABELS[phrase.stage]}
          </Badge>
        </div>
      </div>

      {startedAtWrite ? (
        <WriteStep phrase={phrase} onSaved={update} />
      ) : (
        <>
          <div
            role="group"
            aria-label="Chọn bước luyện"
            className="flex flex-wrap gap-2"
          >
            {modes.map((item) => (
              <Button
                key={item.value}
                variant="secondary"
                aria-pressed={mode === item.value}
                className={cn(mode === item.value && "bg-accent-lime")}
                onClick={() => {
                  setMode(item.value);
                  setRound((current) => current + 1);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {mode === "recall" ? (
            <RecallStep key={round} phrase={phrase} onReviewed={update} />
          ) : (
            <SpeakStep key={round} phrase={phrase} onSpoken={update} />
          )}
        </>
      )}
    </div>
  );
}
