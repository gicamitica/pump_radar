import { cn } from '@/shadcn/lib/utils';
import React from 'react';

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  iconChip?: React.ReactNode;
  className?: string;
}

const FormHeader: React.FC<FormHeaderProps> = ({ title, subtitle, iconChip, className }) => (
  <div className={cn(`text-center space-y-2 mb-6 ${className}`)}>
    {iconChip && <div className="mx-auto size-9 rounded-full bg-blue-600/10 grid place-items-center text-blue-600">{iconChip}</div>}
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    {subtitle && <p className="text-muted-foreground text-sm max-w-sm mx-auto">{subtitle}</p>}
  </div>
);

export default FormHeader;
