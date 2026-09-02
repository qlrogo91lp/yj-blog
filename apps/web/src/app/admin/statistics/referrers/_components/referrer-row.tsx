import { TableCell, TableRow } from '@/components/ui/table';
import type { ReferrerGroupRow } from '@/db/queries/statistics';

type Props = {
  row: ReferrerGroupRow;
  rank: number;
};

export function ReferrerRow({ row, rank }: Props) {
  const showHosts =
    row.hosts.length > 0 &&
    !(row.hosts.length === 1 && row.hosts[0] === row.label);

  return (
    <TableRow>
      <TableCell className="text-muted-foreground text-center">
        {rank}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
            {row.letter}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.label}</p>
            {showHosts && (
              <span className="text-muted-foreground text-xs">
                {row.hosts.join(' · ')}
              </span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">{row.count.toLocaleString()}</TableCell>
      <TableCell className="text-muted-foreground text-right">
        {row.percentage}%
      </TableCell>
    </TableRow>
  );
}
