"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Alert, Button, FormField, Input, Text, cn } from "@/design-system";
import { recordSpoken } from "../dailyGateApi";
import { PHRASE_STAGE_LABELS } from "../display";
import { tokenize } from "../phraseMatcher";
import { canListen, listenEnglish, type Listening } from "../speech";
import type { Phrase, SpokenResult } from "../types";

export interface SpeakStepProps {
  phrase: Phrase;
  onSpoken: (phrase: Phrase) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Trình duyệt chưa cho dùng micro. Hãy cấp quyền rồi thử lại.",
  "service-not-allowed":
    "Trình duyệt chưa cho dùng micro. Hãy cấp quyền rồi thử lại.",
  "no-speech": "Chưa nghe thấy gì. Hãy nói gần micro hơn.",
  "audio-capture": "Không tìm thấy micro.",
  network: "Mất kết nối khi nhận dạng giọng nói.",
};

/**
 * Step 4: say a sentence with the phrase. The browser turns the voice into text and
 * only the text reaches our server, which decides whether it contains the phrase.
 * Where speech recognition is missing, the sentence is typed instead.
 */
export function SpeakStep({ phrase, onSpoken }: SpeakStepProps) {
  const supportsListening = canListen();
  const [isListening, setIsListening] = useState(false);
  const [typed, setTyped] = useState("");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<SpokenResult>();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  const listening = useRef<Listening>(undefined);

  useEffect(() => () => listening.current?.stop(), []);

  async function send(text: string) {
    setIsSending(true);
    setError(undefined);
    try {
      const outcome = await recordSpoken(phrase.id, text);
      setTranscript(text);
      setResult(outcome);
      onSpoken(outcome.phrase);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không gửi được câu này.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function startListening() {
    setError(undefined);
    setResult(undefined);
    setIsListening(true);
    listening.current = listenEnglish({
      onResult: (text) => void send(text),
      onError: (reason) =>
        setError(ERROR_MESSAGES[reason] ?? "Không nhận dạng được giọng nói."),
      onEnd: () => setIsListening(false),
    });
    if (!listening.current) setIsListening(false);
  }

  const words = tokenize(transcript);
  const matched = new Set(result?.matchedIndexes);

  return (
    <div className="flex flex-col gap-4">
      <Text size="body-md">
        Nói một câu có dùng <strong lang="en">{phrase.phrase}</strong>. Nhớ chia
        động từ cho đúng thì.
      </Text>

      {supportsListening ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {isListening ? (
              <Button
                variant="destructive"
                leftIcon={Square}
                onClick={() => listening.current?.stop()}
              >
                Dừng
              </Button>
            ) : (
              <Button
                variant="accent"
                leftIcon={Mic}
                isLoading={isSending}
                onClick={startListening}
              >
                {result ? "Nói lại" : "Bắt đầu nói"}
              </Button>
            )}
            <Text as="span" size="body-sm" role="status">
              {isListening ? "Đang nghe…" : ""}
            </Text>
          </div>
          <Text size="body-sm" color="secondary">
            Trình duyệt (Chrome) gửi âm thanh lên dịch vụ của Google để nhận
            dạng. Máy chủ của chúng tôi chỉ nhận phần chữ.
          </Text>
        </>
      ) : (
        <>
          <Alert variant="info">
            Trình duyệt này không hỗ trợ nhận dạng giọng nói. Hãy nói to câu của
            bạn rồi gõ lại ở đây.
          </Alert>
          <FormField label="Câu bạn vừa nói">
            <Input
              value={typed}
              lang="en"
              autoComplete="off"
              onChange={(event) => setTyped(event.target.value)}
            />
          </FormField>
          <div className="flex justify-end">
            <Button
              variant="accent"
              isLoading={isSending}
              disabled={!typed.trim()}
              onClick={() => void send(typed.trim())}
            >
              Kiểm tra
            </Button>
          </div>
        </>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {result && (
        <Alert
          variant={result.containsPhrase ? "success" : "warning"}
          title={
            result.containsPhrase
              ? "Bạn đã dùng được cụm từ"
              : "Chưa nghe thấy cụm từ"
          }
        >
          <p lang="en" className="break-words">
            {words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className={cn(matched.has(index) && "font-bold underline")}
              >
                {word}{" "}
              </span>
            ))}
          </p>
          {result.containsPhrase
            ? `Trạng thái: ${PHRASE_STAGE_LABELS[result.phrase.stage]}.`
            : "Thử nói lại, dùng đủ các từ của cụm theo đúng thứ tự."}
        </Alert>
      )}
    </div>
  );
}
