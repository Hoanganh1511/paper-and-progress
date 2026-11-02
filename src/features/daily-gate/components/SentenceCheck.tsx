import { Check, CircleAlert } from "lucide-react";
import { Text } from "@/design-system";
import { containsPhrase } from "../phraseMatcher";

/**
 * Instant feedback while typing a sentence: does it use the phrase? Uses the same
 * matcher as the server, which still has the last word.
 */
export function SentenceCheck({
  phrase,
  sentence,
}: {
  phrase: string;
  sentence: string;
}) {
  const hasText = sentence.trim().length > 0;
  const isMatch = hasText && containsPhrase(phrase, sentence);
  return (
    <Text
      as="p"
      size="body-sm"
      role="status"
      className="flex min-h-6 items-center gap-1.5"
    >
      {!hasText ? null : isMatch ? (
        <>
          <Check aria-hidden="true" size={16} />
          Câu đã có cụm từ.
        </>
      ) : (
        <>
          <CircleAlert aria-hidden="true" size={16} />
          Chưa thấy “{phrase}” trong câu. Có thể chia động từ hoặc đổi “a/the”.
        </>
      )}
    </Text>
  );
}
