import { Card } from '@/shared/ui/shadcn/components/ui/card';
import React from 'react';

const LayoutHero: React.FC<{ header: React.ReactNode; children: React.ReactNode; hero?: React.ReactNode; footer?: React.ReactNode }>
= ({ header, children, hero, footer }) => (
  <div className="min-h-[calc(100vh-80px)] grid place-items-center p-4">
    <Card className="w-full max-w-6xl rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/30 py-0 overflow-visible border-0">
      <div className="grid md:grid-cols-2">
        {/* Form side */}
        <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md">
            {header}
            <div className="space-y-4">{children}</div>
            {footer && <div className="mt-6 text-sm">{footer}</div>}
          </div>
        </div>

        {/* Hero side */}
        <div className="hidden md:block p-8 lg:p-12 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 text-white relative overflow-visible rounded-r-3xl">
          {hero}
        </div>
      </div>
    </Card>
  </div>
);

export default LayoutHero;
