"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { useOverlayLayer } from "../../../hooks/useOverlayLayer";
import { useFormField } from "../FormField/FormFieldContext";
import {
  SelectContext,
  normalizeText,
  queryOptions,
  toOptionId,
  type SelectItemRecord,
  type SelectMode,
  type SelectMove,
  type SelectOpenTarget,
} from "./SelectContext";

export interface SelectRootProps extends Omit<
  ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  /** "select" shows a button trigger; "combobox" a searchable text input. */
  mode: SelectMode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Adds a hidden input so the value is submitted with a surrounding <form>. */
  name?: string;
  disabled?: boolean;
}

/**
 * Shared state machine of Select and Combobox: selected value, open state,
 * the active (highlighted) option, the item registry and the search text.
 * Focus stays on the trigger / input; the active option is announced through
 * aria-activedescendant. `className` and `ref` apply to the wrapping element.
 */
export function SelectRoot({
  mode,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled = false,
  className,
  children,
  ref,
  ...props
}: SelectRootProps) {
  const baseId = useId();
  const field = useFormField();
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const controlRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [activeValue, setActiveValue] = useState<string>();
  const [items, setItems] = useState<ReadonlyMap<string, SelectItemRecord>>(
    () => new Map(),
  );
  const [searchText, setSearchText] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  const selectedLabel =
    currentValue !== undefined ? items.get(currentValue)?.textValue : undefined;
  // Until the user types, the input shows the selected label and nothing is filtered.
  const query = mode === "combobox" && isFiltering ? searchText : "";
  const inputValue = isFiltering ? searchText : (selectedLabel ?? "");

  const matches = useCallback(
    (textValue: string) =>
      query === "" || normalizeText(textValue).includes(normalizeText(query)),
    [query],
  );

  const visibleCount = useMemo(() => {
    let count = 0;
    items.forEach((record) => {
      if (matches(record.textValue)) count += 1;
    });
    return count;
  }, [items, matches]);

  const registerItem = useCallback(
    (itemValue: string, record: SelectItemRecord) => {
      setItems((previous) => new Map(previous).set(itemValue, record));
      return () =>
        setItems((previous) => {
          const next = new Map(previous);
          next.delete(itemValue);
          return next;
        });
    },
    [],
  );

  const getOptions = useCallback(() => queryOptions(contentRef.current), []);

  const closeList = useCallback(() => {
    setIsOpen(false);
    setActiveValue(undefined);
    setIsFiltering(false);
  }, []);

  const openList = useCallback(
    (target: SelectOpenTarget) => {
      const options = getOptions();
      const next =
        target === "last"
          ? options[options.length - 1]
          : target === "selected"
            ? (options.find(
                (option) => option.dataset.value === currentValue,
              ) ?? options[0])
            : options[0];
      setActiveValue(next?.dataset.value);
      setIsOpen(true);
    },
    [getOptions, currentValue],
  );

  const moveActive = useCallback(
    (move: SelectMove) => {
      const options = getOptions();
      if (options.length === 0) return;
      const index = options.findIndex(
        (option) => option.dataset.value === activeValue,
      );
      let nextIndex: number;
      switch (move) {
        case "next":
          nextIndex = (index + 1) % options.length;
          break;
        case "prev":
          nextIndex = index <= 0 ? options.length - 1 : index - 1;
          break;
        case "first":
          nextIndex = 0;
          break;
        case "last":
          nextIndex = options.length - 1;
          break;
      }
      setActiveValue(options[nextIndex].dataset.value);
    },
    [getOptions, activeValue],
  );

  const selectValue = useCallback(
    (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue);
      onValueChange?.(nextValue);
      closeList();
      controlRef.current?.focus();
    },
    [isControlled, onValueChange, closeList],
  );

  const onInputChange = useCallback((text: string) => {
    setSearchText(text);
    setIsFiltering(true);
    setIsOpen(true);
  }, []);

  // While searching, the first remaining option is the active one.
  useEffect(() => {
    if (mode !== "combobox" || !isOpen || !isFiltering) return;
    setActiveValue(queryOptions(contentRef.current)[0]?.dataset.value);
  }, [mode, isOpen, isFiltering, searchText]);

  const isTopmost = useOverlayLayer(isOpen);
  useEscapeKey(isOpen, closeList, isTopmost);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeList();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, closeList]);

  const context = {
    mode,
    value: currentValue,
    selectedLabel,
    isOpen,
    isDisabled: disabled,
    controlId: field?.id ?? `${baseId}-control`,
    listboxId: `${baseId}-listbox`,
    labelId: field?.labelId,
    controlRef,
    contentRef,
    activeValue,
    setActiveValue,
    getOptionId: (optionValue: string) => toOptionId(baseId, optionValue),
    inputValue,
    onInputChange,
    visibleCount,
    hasItems: items.size > 0,
    matches,
    registerItem,
    getOptions,
    openList,
    closeList,
    moveActive,
    selectValue,
  };

  return (
    <SelectContext value={context}>
      <div
        ref={mergedRef}
        data-select-root=""
        className={cn("relative w-full", className)}
        {...props}
      >
        {children}
        {name && <input type="hidden" name={name} value={currentValue ?? ""} />}
      </div>
    </SelectContext>
  );
}
