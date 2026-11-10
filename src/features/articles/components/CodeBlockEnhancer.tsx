"use client";

import { useEffect } from "react";

const COPY_LABEL = "Sao chép";
const COPIED_LABEL = "Đã sao chép";

/**
 * Wraps each code block of the article in a bar with its language and a copy button.
 * The blocks come in as plain HTML from the backend, so this adds the bar after they
 * are on the page; without JavaScript the code still reads fine, just without the bar.
 */
export function CodeBlockEnhancer({ htmlKey }: { htmlKey: string }) {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const pres = document.querySelectorAll<HTMLPreElement>(
      ".rich-text > pre:not([data-enhanced])",
    );
    for (const pre of pres) {
      const code = pre.querySelector("code");
      const language =
        /language-([\w-]+)/.exec(code?.className ?? "")?.[1] ?? "text";

      const wrapper = document.createElement("div");
      wrapper.className = "code-block";
      const bar = document.createElement("div");
      bar.className = "code-block-bar";
      const label = document.createElement("span");
      label.textContent = language === "plaintext" ? "text" : language;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-block-copy";
      button.textContent = COPY_LABEL;
      button.setAttribute("aria-label", `${COPY_LABEL} mã ${label.textContent}`);

      let timer: ReturnType<typeof setTimeout> | undefined;
      const onClick = () => {
        void navigator.clipboard
          ?.writeText(code?.textContent ?? "")
          .then(() => {
            button.textContent = COPIED_LABEL;
            clearTimeout(timer);
            timer = setTimeout(() => {
              button.textContent = COPY_LABEL;
            }, 2000);
          })
          .catch(() => undefined);
      };
      button.addEventListener("click", onClick);

      bar.append(label, button);
      pre.dataset.enhanced = "true";
      pre.replaceWith(wrapper);
      wrapper.append(bar, pre);

      cleanups.push(() => {
        clearTimeout(timer);
        button.removeEventListener("click", onClick);
        // Put the block back so a re-run (or React re-rendering the HTML) starts clean.
        if (wrapper.isConnected) {
          delete pre.dataset.enhanced;
          wrapper.replaceWith(pre);
        }
      });
    }
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [htmlKey]);

  return null;
}
