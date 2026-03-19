/**
 * CodeExample - Interactive code example viewer with preview and code tabs.
 * Supports copy-to-clipboard with whitelist-based permission.
 */

import React, { useState } from 'react';
import { Copy, Check, Code2, Eye } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/components/ui/tabs';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useService } from '@/app/providers/useDI';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IPublicCodeExampleWhitelist, PublicCodeExampleId } from '@/shared/infrastructure/code-examples/PublicCodeExampleWhitelist';

/** Spotlight color variants */
export type SpotlightVariant = 'primary' | 'purple' | 'blue' | 'cyan' | 'teal' | 'green';

/** Props for CodeExample component */
export type CodeExampleProps = {
  id: PublicCodeExampleId | string;
  title?: string;
  description?: string;
  code: string;
  language?: 'tsx' | 'ts' | 'js' | 'jsx' | 'css' | 'json' | string;
  children: React.ReactNode;
  className?: string;
  /** Optional spotlight effect variant */
  spotlight?: SpotlightVariant;
};

const CodeExample: React.FC<CodeExampleProps> = ({
  id,
  title,
  description,
  code,
  language = 'tsx',
  children,
  className,
  spotlight,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const { copy, copied } = useCopyToClipboard();
  const whitelist = useService<IPublicCodeExampleWhitelist>(CORE_SYMBOLS.IPublicCodeExampleWhitelist);

  const canCopy = whitelist.isAllowed(id);

  const handleCopy = () => {
    if (canCopy) {
      copy(code);
    }
  };

  // Spotlight gradient configurations
  const spotlightConfig = spotlight ? {
    primary: {
      border: 'border-primary/30 hover:border-primary/50',
      shadow: 'hover:shadow-lg hover:shadow-primary/10',
      gradient: 'from-primary/10 via-transparent to-purple-500/10',
      spotlight: 'bg-primary/10',
    },
    purple: {
      border: 'border-purple-500/30 hover:border-purple-500/50',
      shadow: 'hover:shadow-lg hover:shadow-purple-500/10',
      gradient: 'from-purple-500/10 via-transparent to-blue-500/10',
      spotlight: 'bg-purple-500/10',
    },
    blue: {
      border: 'border-blue-500/30 hover:border-blue-500/50',
      shadow: 'hover:shadow-lg hover:shadow-blue-500/10',
      gradient: 'from-blue-500/10 via-transparent to-cyan-500/10',
      spotlight: 'bg-blue-500/10',
    },
    cyan: {
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      shadow: 'hover:shadow-lg hover:shadow-cyan-500/10',
      gradient: 'from-cyan-500/10 via-transparent to-teal-500/10',
      spotlight: 'bg-cyan-500/10',
    },
    teal: {
      border: 'border-teal-500/30 hover:border-teal-500/50',
      shadow: 'hover:shadow-lg hover:shadow-teal-500/10',
      gradient: 'from-teal-500/10 via-transparent to-green-500/10',
      spotlight: 'bg-teal-500/10',
    },
    green: {
      border: 'border-green-500/30 hover:border-green-500/50',
      shadow: 'hover:shadow-lg hover:shadow-green-500/10',
      gradient: 'from-green-500/10 via-transparent to-emerald-500/10',
      spotlight: 'bg-green-500/10',
    },
  }[spotlight] : null;

  return (
    <div className={cn('group relative flex flex-col', spotlight && 'overflow-hidden rounded-lg', !spotlight && 'h-full')}>
      {/* Spotlight effects - only when variant is specified */}
      {spotlightConfig && (
        <>
          {/* Internal gradient */}
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', spotlightConfig.gradient)} />
          {/* Hover spotlight */}
          <div className={cn(
            'absolute top-0 right-0 w-1/3 h-1/3 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            spotlightConfig.spotlight
          )} />
        </>
      )}

      <Card className={cn(
        'py-4 gap-0 relative flex flex-col',
        spotlight && cn(
          'border bg-card/95 backdrop-blur-sm transition-all duration-300 h-full',
          spotlightConfig?.border,
          spotlightConfig?.shadow
        ),
        !spotlight && 'h-full',
        className
      )}>
        {(title || description) && (
          <CardHeader className="pb-3">
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="p-0 flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code')} className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
              <TabsList className="h-8">
                <TabsTrigger value="preview" className="text-xs h-7 px-3">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs h-7 px-3">
                  <Code2 className="h-3.5 w-3.5 mr-1.5" />
                  Code
                </TabsTrigger>
              </TabsList>
              {canCopy && activeTab === 'code' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5 text-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>

            <TabsContent value="preview" className="m-0 p-6 flex-1">
              {children}
            </TabsContent>

            <TabsContent value="code" className="m-0 flex-1">
              <div className="relative h-full">
                <pre className="overflow-x-auto p-4 bg-muted/50 text-sm h-full">
                  <code className={`language-${language}`}>{code}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeExample;
