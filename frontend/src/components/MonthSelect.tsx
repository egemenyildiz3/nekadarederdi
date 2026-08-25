const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

type MonthSelectProps = {
  label: string;
  value: string;
  minYear: number;
  maxYear: number;
  maxMonth?: string;
  onChange: (value: string) => void;
};

export function MonthSelect({ label, value, minYear, maxYear, maxMonth, onChange }: MonthSelectProps) {
  const [yearPart, monthPart] = value.split('-');
  const selectedYear = Number(yearPart);
  const selectedMonth = Number(monthPart);
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
  const maxMonthYear = maxMonth ? Number(maxMonth.slice(0, 4)) : null;
  const maxMonthNumber = maxMonth ? Number(maxMonth.slice(5, 7)) : null;

  function setMonth(month: number) {
    onChange(clampMonth(`${selectedYear}-${String(month).padStart(2, '0')}`));
  }

  function setYear(year: number) {
    onChange(clampMonth(`${year}-${String(selectedMonth).padStart(2, '0')}`));
  }

  function clampMonth(month: string) {
    return maxMonth && month > maxMonth ? maxMonth : month;
  }

  function isDisabledMonth(month: number) {
    return Boolean(maxMonthYear && maxMonthNumber && selectedYear === maxMonthYear && month > maxMonthNumber);
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-ink-800">{label}</legend>
      <div className="grid grid-cols-[minmax(0,1fr)_108px] gap-2">
        <label className="sr-only" htmlFor={`${label}-month`}>
          Ay
        </label>
        <select
          id={`${label}-month`}
          className="h-12 rounded-md border border-ink-200 bg-paper-50 px-3 text-base text-ink-950 outline-none transition focus:border-oxide-700 focus:ring-4 focus:ring-oxide-100"
          value={selectedMonth}
          onChange={(event) => setMonth(Number(event.target.value))}
        >
          {MONTHS.map((month, index) => (
            <option disabled={isDisabledMonth(index + 1)} key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor={`${label}-year`}>
          Yıl
        </label>
        <select
          id={`${label}-year`}
          className="h-12 rounded-md border border-ink-200 bg-paper-50 px-3 font-data text-base text-ink-950 outline-none transition focus:border-oxide-700 focus:ring-4 focus:ring-oxide-100"
          value={selectedYear}
          onChange={(event) => setYear(Number(event.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
