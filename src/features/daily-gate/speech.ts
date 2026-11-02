/** Is text-to-speech available in this browser? */
export const canSpeak = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

/** Reads English text aloud (en-US). Does nothing where speech is not supported. */
export function speakEnglish(text: string) {
  if (!canSpeak() || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionConstructor = new () => Recognition;

const recognitionConstructor = (): RecognitionConstructor | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

/** Is speech recognition available? (Chrome and Edge; Firefox has none.) */
export const canListen = () => recognitionConstructor() !== undefined;

export interface Listening {
  stop: () => void;
}

/**
 * Listens once and reports what was heard. The browser, not our server, does the
 * recognition (Chrome sends the audio to Google). Returns undefined where it is
 * not supported.
 */
export function listenEnglish(handlers: {
  onResult: (transcript: string) => void;
  onError: (reason: string) => void;
  onEnd: () => void;
}): Listening | undefined {
  const Ctor = recognitionConstructor();
  if (!Ctor) return undefined;
  const recognition = new Ctor();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript;
    if (transcript) handlers.onResult(transcript);
  };
  recognition.onerror = (event) => handlers.onError(event.error);
  recognition.onend = handlers.onEnd;
  recognition.start();
  return { stop: () => recognition.stop() };
}
