/**
 * How long the writer must stop typing before the draft is saved by itself.
 * Typing again starts the count over, so a draft is saved once per pause, not
 * while the writer is still going.
 */
export const AUTOSAVE_DELAY_MS = 5000;
