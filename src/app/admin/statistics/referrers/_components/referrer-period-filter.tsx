'use client';

import { useRouter } from 'next/navigation';

type Option = {
  label: string;
  value: string;
};

type Props = {
  options: Option[];
  current: string;
};

export function ReferrerPeriodFilter({ options, current }: Props) {
  const router = useRouter();

  const handleChange = (value: string) => {
    router.push(`/admin/statistics/referrers?days=${value}`);
  };

  return (
    <div className="flex gap-1 rounded-lg border p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            current === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
