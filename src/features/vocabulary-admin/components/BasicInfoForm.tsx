"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import {
  Badge,
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Text,
  Textarea,
  cn,
} from "@/design-system";
import { PART_OF_SPEECH_OPTIONS, SECTION_OPTIONS } from "../categories";
import { CEFR_LEVELS, type VocabUnit, type WordBasics } from "../types";
import type { BasicsErrors } from "../validate";

export interface BasicInfoFormProps {
  value: WordBasics;
  errors: BasicsErrors;
  units: readonly VocabUnit[];
  onChange: (changes: Partial<WordBasics>) => void;
}

/** The word itself: its spelling, kinds, level, topics and meanings. */
export function BasicInfoForm({
  value,
  errors,
  units,
  onChange,
}: BasicInfoFormProps) {
  const [topic, setTopic] = useState("");

  function addTopic() {
    const name = topic.trim();
    if (!name) return;
    if (!value.topics.some((t) => t.toLowerCase() === name.toLowerCase())) {
      onChange({ topics: [...value.topics, name] });
    }
    setTopic("");
  }

  function handleTopicKey(event: KeyboardEvent<HTMLInputElement>) {
    // Enter adds the topic; it must not submit the whole form.
    if (event.key === "Enter") {
      event.preventDefault();
      addTopic();
    }
  }

  const togglePart = (part: string) =>
    onChange({
      partsOfSpeech: value.partsOfSpeech.includes(part)
        ? value.partsOfSpeech.filter((p) => p !== part)
        : [...value.partsOfSpeech, part],
    });

  return (
    <section aria-labelledby="category-basic" className="flex flex-col gap-5">
      <header>
        <Text
          as="h2"
          id="category-basic"
          size="heading-md"
          weight="bold"
          className="font-display"
        >
          Thông tin từ
        </Text>
        <Text size="body-sm" color="secondary">
          Chỉ phần này là bắt buộc. Các nhóm học bên cạnh có thể bổ sung dần.
        </Text>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Unit" required error={errors.unitId}>
          <Select
            value={value.unitId === undefined ? "" : String(value.unitId)}
            onValueChange={(next) => onChange({ unitId: Number(next) })}
          >
            <SelectTrigger placeholder="Chọn unit" />
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={String(unit.id)}>
                  Unit {unit.unitNumber} · {unit.topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Nhóm trong bài học" required>
          <Select
            value={value.section}
            onValueChange={(next) =>
              onChange({ section: next as WordBasics["section"] })
            }
          >
            <SelectTrigger />
            <SelectContent>
              {SECTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Từ" required error={errors.word}>
          <Input
            value={value.word}
            maxLength={120}
            autoComplete="off"
            placeholder="artificial"
            onChange={(event) => onChange({ word: event.target.value })}
          />
        </FormField>
        <FormField label="Phát âm" description="VD: /ˌɑːtɪˈfɪʃl/">
          <Input
            value={value.pronunciation}
            maxLength={100}
            autoComplete="off"
            onChange={(event) =>
              onChange({ pronunciation: event.target.value })
            }
          />
        </FormField>
      </div>

      <FormField
        label="Từ loại"
        required
        error={errors.partsOfSpeech}
        description="Chọn nhiều nếu từ vừa là danh từ vừa là động từ."
      >
        <div role="group" aria-label="Từ loại" className="flex flex-wrap gap-2">
          {PART_OF_SPEECH_OPTIONS.map((option) => {
            const isOn = value.partsOfSpeech.includes(option.value);
            return (
              <Button
                key={option.value}
                type="button"
                size="compact"
                variant={isOn ? "accent" : "outline"}
                aria-pressed={isOn}
                onClick={() => togglePart(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Cấp độ (CEFR)" required error={errors.level}>
          <Select
            value={value.level}
            onValueChange={(next) =>
              onChange({ level: next as WordBasics["level"] })
            }
          >
            <SelectTrigger placeholder="Chọn cấp độ" />
            <SelectContent>
              {CEFR_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          label="Chủ đề"
          description="Gõ tên chủ đề rồi bấm Enter để thêm."
        >
          <div className="flex gap-2">
            <Input
              value={topic}
              maxLength={40}
              autoComplete="off"
              placeholder="Công nghệ"
              onChange={(event) => setTopic(event.target.value)}
              onKeyDown={handleTopicKey}
            />
            <Button
              type="button"
              variant="outline"
              leftIcon={Plus}
              aria-label="Thêm chủ đề"
              disabled={!topic.trim()}
              onClick={addTopic}
            />
          </div>
        </FormField>
      </div>
      {value.topics.length > 0 && (
        <ul aria-label="Chủ đề đã chọn" className="-mt-2 flex flex-wrap gap-2">
          {value.topics.map((name) => (
            <li key={name}>
              <Badge
                removable
                removeLabel={`Bỏ chủ đề ${name}`}
                onRemove={() =>
                  onChange({ topics: value.topics.filter((t) => t !== name) })
                }
              >
                {name}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <FormField
        label="Định nghĩa ngắn (tiếng Anh)"
        required
        error={errors.meaning}
      >
        <Textarea
          rows={2}
          value={value.meaning}
          maxLength={500}
          lang="en"
          onChange={(event) => onChange({ meaning: event.target.value })}
        />
      </FormField>
      <FormField label="Nghĩa tiếng Việt" required error={errors.meaningVi}>
        <Textarea
          rows={2}
          value={value.meaningVi}
          maxLength={500}
          onChange={(event) => onChange({ meaningVi: event.target.value })}
        />
      </FormField>

      <details
        className={cn(
          "rounded-standard border-2 border-border-strong bg-surface-card p-4",
        )}
      >
        <summary className="min-h-11 cursor-pointer font-semibold">
          Thẻ học trong Daily English (tùy chọn)
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <FormField label="Câu ví dụ chính" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={value.example}
              maxLength={500}
              lang="en"
              onChange={(event) => onChange({ example: event.target.value })}
            />
          </FormField>
          <FormField label="Từ dễ nhầm" description="VD: journey / trip">
            <Input
              value={value.contrast}
              maxLength={300}
              onChange={(event) => onChange({ contrast: event.target.value })}
            />
          </FormField>
          <FormField label="Dạng từ" description="VD: arrival (noun)">
            <Input
              value={value.forms}
              maxLength={300}
              onChange={(event) => onChange({ forms: event.target.value })}
            />
          </FormField>
          <FormField label="Cấu trúc" className="sm:col-span-2">
            <Input
              value={value.pattern}
              maxLength={300}
              onChange={(event) => onChange({ pattern: event.target.value })}
            />
          </FormField>
        </div>
      </details>
    </section>
  );
}
