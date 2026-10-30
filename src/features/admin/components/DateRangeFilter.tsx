import { DatePicker, FormField, datePickerLabelsVi } from "@/design-system";

export interface DateRangeFilterProps {
  /** `YYYY-MM-DD`, or empty for no limit. */
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

/** Two date fields; the end can not be before the start. */
export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  return (
    <>
      <FormField label="Từ ngày">
        <DatePicker
          value={from}
          max={to || undefined}
          onValueChange={(next) => onChange({ from: next, to })}
          labels={datePickerLabelsVi}
        />
      </FormField>
      <FormField label="Đến ngày">
        <DatePicker
          value={to}
          min={from || undefined}
          onValueChange={(next) => onChange({ from, to: next })}
          labels={datePickerLabelsVi}
        />
      </FormField>
    </>
  );
}
