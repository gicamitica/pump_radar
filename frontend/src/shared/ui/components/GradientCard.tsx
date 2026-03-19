import { Card } from "@/shadcn/components/ui/card";

/**
 * GradientCard - Card with gradient background styling.
 */
export const GradientCard = ({ children }: { children: React.ReactNode }) => (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-card to-muted/30">
        {children}
    </Card>
)