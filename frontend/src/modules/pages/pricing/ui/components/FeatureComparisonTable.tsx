import { Check, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/shadcn/components/ui/table';
import type { Feature, PlanId } from '../../domain/models';

interface FeatureComparisonTableProps {
  features: Feature[];
  plans: { id: PlanId; name: string }[];
}

export function FeatureComparisonTable({ features, plans }: FeatureComparisonTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Feature</TableHead>
          {plans.map((plan) => (
            <TableHead key={plan.id} className="text-center">{plan.name}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {features.map((feature) => (
          <TableRow key={feature.id}>
            <TableCell>{feature.name}</TableCell>
            {plans.map((plan) => (
              <TableCell key={plan.id} className="text-center">
                {typeof feature.availability[plan.id] === 'boolean' ? (
                  feature.availability[plan.id] ? (
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  )
                ) : (
                  <span>{feature.availability[plan.id]}</span>
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
