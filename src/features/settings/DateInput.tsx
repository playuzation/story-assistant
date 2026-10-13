import type { StoryDate } from '../../domain/index.ts';

const FIELDS = [
  ['year', '년'],
  ['month', '월'],
  ['day', '일'],
] as const;

interface DateInputProps {
  value: StoryDate;
  onChange: (value: StoryDate) => void;
}

/**
 * 연/월/일 숫자 입력 (월·일은 비워둘 수 있음).
 * 음수 연도 입력 중 '-' 가 지워지지 않도록 비제어 입력을 사용한다.
 */
export function DateInput({ value, onChange }: DateInputProps) {
  return (
    <span className="date-input">
      {FIELDS.map(([field, unit]) => (
        <label key={field}>
          <input
            type="number"
            min={field === 'year' ? undefined : 1}
            defaultValue={value[field] ?? ''}
            onChange={(e) =>
              onChange({ ...value, [field]: e.target.value === '' ? null : Math.trunc(Number(e.target.value)) })
            }
          />
          {unit}
        </label>
      ))}
    </span>
  );
}
