import { Skeleton } from '@/shared/ui/components/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table';
import { cn } from '@/shadcn/lib/utils';

interface TableSkeletonProps {
  columnCount: number;
  rowCount?: number;
  showExpand?: boolean;
  density?: 'compact' | 'normal' | 'spacious';
  className?: string;
}

/**
 * TableSkeleton - A reusable loading state for any table.
 * Provides a high-fidelity shimmer effect that matches the table's structure.
 */
export function TableSkeleton({
  columnCount,
  rowCount = 5,
  showExpand = false,
  density = 'normal',
  className,
}: TableSkeletonProps) {
  const actualColumnCount = showExpand ? columnCount + 1 : columnCount;

  return (
    <div className={cn("animate-in fade-in duration-500", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: actualColumnCount }).map((_, i) => (
              <TableHead key={i} className="py-3">
                <Skeleton className="h-4 w-2/3" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: actualColumnCount }).map((_, colIndex) => (
                <TableCell
                  key={colIndex}
                  className={cn(
                    density === 'compact' && 'py-2',
                    density === 'normal' && 'py-3',
                    density === 'spacious' && 'py-4'
                  )}
                >
                  <Skeleton 
                    className={cn(
                      "h-4", 
                      colIndex === 0 ? "w-1/2" : "w-full",
                      colIndex === actualColumnCount - 1 ? "w-1/4 ml-auto" : ""
                    )} 
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
