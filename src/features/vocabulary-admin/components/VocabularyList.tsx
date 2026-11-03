"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Badge,
  LinkButton,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@/design-system";
import {
  useAdminQuery,
  useDebouncedValue,
} from "@/features/admin/useAdminQuery";
import { QueryError } from "@/features/admin/components/QueryError";
import { TableMessage } from "@/features/admin/components/TableMessage";
import { TablePager } from "@/features/admin/components/TablePager";
import { CATEGORIES, PART_OF_SPEECH_OPTIONS } from "../categories";
import { CEFR_LEVELS, type CefrLevel, type WordSummary } from "../types";
import { getVocabularyMeta, listVocabulary } from "../vocabularyApi";

const PAGE_SIZE = 20;
const ALL = "all";

const partName = (value: string) =>
  PART_OF_SPEECH_OPTIONS.find((option) => option.value === value)?.label ??
  value;

/** How many categories are completed and how many are still being written. */
function progressOf(word: WordSummary) {
  const states = CATEGORIES.map((c) => word.categories[c.key].state);
  return {
    completed: states.filter((s) => s === "COMPLETED").length,
    inProgress: states.filter((s) => s === "IN_PROGRESS").length,
  };
}

/** `/admin/vocabulary`: every word of Daily English; a row opens the editor. */
export function VocabularyList() {
  const [search, setSearch] = useState("");
  const [unitId, setUnitId] = useState<string>(ALL);
  const [level, setLevel] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search.trim());

  const meta = useAdminQuery(getVocabularyMeta, "vocabulary-meta");
  const query = useAdminQuery(
    () =>
      listVocabulary({
        page,
        limit: PAGE_SIZE,
        ...(q && { q }),
        ...(unitId !== ALL && { unitId: Number(unitId) }),
        ...(level !== ALL && { level: level as CefrLevel }),
      }),
    JSON.stringify([page, q, unitId, level]),
  );
  const items = query.data?.items;
  const reset = () => setPage(1);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text
            as="h1"
            size="heading-lg"
            weight="bold"
            className="font-display"
          >
            Vocabulary
          </Text>
          <Text size="body-sm" color="secondary">
            Từ vựng của Daily English và nội dung học của từng từ.
          </Text>
        </div>
        <LinkButton
          href="/admin/vocabulary/new"
          variant="accent"
          leftIcon={Plus}
        >
          Thêm từ
        </LinkButton>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          aria-label="Tìm theo từ hoặc nghĩa"
          placeholder="Tìm theo từ hoặc nghĩa"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            reset();
          }}
          onClear={() => {
            setSearch("");
            reset();
          }}
          className="w-full sm:w-72"
        />
        <Select
          value={unitId}
          onValueChange={(next) => {
            setUnitId(next);
            reset();
          }}
          className="w-56"
        >
          <SelectTrigger aria-label="Lọc theo unit" />
          <SelectContent>
            <SelectItem value={ALL}>Tất cả unit</SelectItem>
            {meta.data?.units.map((unit) => (
              <SelectItem key={unit.id} value={String(unit.id)}>
                Unit {unit.unitNumber} · {unit.topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={level}
          onValueChange={(next) => {
            setLevel(next);
            reset();
          }}
          className="w-40"
        >
          <SelectTrigger aria-label="Lọc theo cấp độ" />
          <SelectContent>
            <SelectItem value={ALL}>Mọi cấp độ</SelectItem>
            {CEFR_LEVELS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryError error={query.error} onRetry={query.reload} />
      <Table compact hoverable aria-busy={query.isLoading}>
        <TableHeader>
          <TableRow>
            <TableHead>Từ</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Loại từ</TableHead>
            <TableHead>Cấp độ</TableHead>
            <TableHead>Nghĩa</TableHead>
            <TableHead>Nhóm học</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.length === 0 && (
            <TableMessage colSpan={6}>Không có từ nào khớp.</TableMessage>
          )}
          {items?.map((word) => {
            const { completed, inProgress } = progressOf(word);
            return (
              <TableRow key={word.id}>
                <TableCell>
                  <Link
                    href={`/admin/vocabulary/${word.id}`}
                    lang="en"
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {word.word}
                  </Link>
                </TableCell>
                <TableCell>Unit {word.unit.unitNumber}</TableCell>
                <TableCell>
                  <span className="flex flex-wrap gap-1">
                    {word.partsOfSpeech.length === 0
                      ? "—"
                      : word.partsOfSpeech.map((part) => (
                          <Badge key={part} size="sm">
                            {partName(part)}
                          </Badge>
                        ))}
                  </span>
                </TableCell>
                <TableCell>
                  {word.level ? (
                    <Badge variant="blue" size="sm">
                      {word.level}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{word.meaningVi || word.meaning}</TableCell>
                <TableCell>
                  {completed === 0 && inProgress === 0
                    ? "Chưa có"
                    : `${completed} hoàn thành${inProgress ? ` · ${inProgress} đang soạn` : ""}`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePager
        page={page}
        total={query.data?.total ?? 0}
        limit={PAGE_SIZE}
        onPageChange={setPage}
      />
    </>
  );
}
