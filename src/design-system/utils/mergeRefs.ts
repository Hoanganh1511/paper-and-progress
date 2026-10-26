import { type Ref, type RefCallback } from "react";

/**
 * Combine several refs (object or callback) into one callback ref.
 * Memoise the result (useMemo) to avoid re-attaching on every render.
 */
export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
  return (node) => {
    const cleanups: Array<() => void> = [];

    refs.forEach((ref) => {
      if (typeof ref === "function") {
        const cleanup = ref(node);
        cleanups.push(
          typeof cleanup === "function" ? cleanup : () => ref(null),
        );
      } else if (ref) {
        ref.current = node;
        cleanups.push(() => {
          ref.current = null;
        });
      }
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  };
}
