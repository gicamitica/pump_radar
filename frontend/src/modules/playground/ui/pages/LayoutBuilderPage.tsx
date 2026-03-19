import React, { useMemo } from 'react';
import { useLayout, type AppLayoutSettings } from '@/shared/ui/layouts/app';

import { Button } from '@/shared/ui/shadcn/components/ui/button';


import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/components/ui/dialog';
import { ScrollArea } from '@/shared/ui/shadcn/components/ui/scroll-area';
import { PageHeader } from '@/shared/ui/components/PageHeader';
import { 
  FieldRadioGroup,
  FieldSwitchGroup
} from '@/shared/ui/components/forms/composites/field';

import PageLayout from '@/shared/ui/components/PageLayout';
import { FormSection } from '@/shared/ui/components/forms/layout/FormSection';
import { 
  Code, 
  RotateCcw, 
  ClipboardCheck, 
  User, 
  Database, 
  Monitor, 
  LayoutGrid, 
  Columns, 
  PanelRight, 
  SunMoon,
  ToggleRight,
  Palette,
  Maximize2
} from 'lucide-react';

const LayoutBuilderContent: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetSettings 
   } = useLayout();

  const [copied, setCopied] = React.useState(false);

  const copyCode = () => {
    const code = generateCode(settings);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Map variant UI string to global layoutMode
  const variant = useMemo(() => {
    if (settings.layoutMode === 'vertical-edge') return 'edge';
    if (settings.layoutMode === 'vertical-boxed') return 'boxed';
    if (settings.layoutMode === 'vertical-two-columns') return 'two-column';
    return 'edge';
  }, [settings.layoutMode]);

  const setVariant = (v: string) => {
    const modeMap: Record<string, any> = {
      'edge': 'vertical-edge',
      'boxed': 'vertical-boxed',
      'two-column': 'vertical-two-columns'
    };
    updateSettings({ layoutMode: modeMap[v] });
  };

  return (
    <PageLayout>
      <PageHeader 
        title="Layout Builder"
        subtitle="Configure and generate your custom application layout"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={resetSettings}>
              <RotateCcw className="size-4" /> Reset
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-primary">
                  <Code className="size-4" /> Get Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Implementation Strategy</DialogTitle>
                    <Button size="sm" variant="ghost" onClick={copyCode} className="gap-2">
                       {copied ? <ClipboardCheck className="size-4 text-emerald-500" /> : <Code className="size-4" />}
                       {copied ? 'Copied!' : 'Copy Config'}
                    </Button>
                  </div>
                </DialogHeader>
                <ScrollArea className="flex-1 bg-zinc-950 rounded-xl p-4 my-4 border border-white/10">
                  <pre className="text-xs text-zinc-300 font-mono">
                    {generateCode(settings)}
                  </pre>
                </ScrollArea>
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded-lg">
                  <p className="font-bold mb-1 text-primary">How to implement:</p>
                  1. Pass the generated settings as defaults to your LayoutProvider.<br/>
                  2. Use the VerticalLayout variants in your route configuration.
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="mt-8 pb-12 space-y-16">
        {/* Important Info Banner */}
        <div className="relative group overflow-hidden p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-6">
           <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
              <Monitor className="size-6" />
           </div>
           <div className="flex-1 min-w-0">
              <div className="text-sm font-black uppercase tracking-[0.2em] text-indigo-500 mb-1">Architecture Note</div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                 This builder is optimized for <strong className="text-foreground">Vertical Layouts</strong>. Horizontal variations are standardized 
                 across the template and do not require structural customization.
              </p>
           </div>
           <div className="absolute right-0 top-0 size-32 bg-indigo-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="space-y-16 max-w-7xl mx-auto">
          {/* Section 1: Foundation & Aesthetics */}
          <FormSection
            title="Sidebar Foundation"
            description="Establish the structural architecture and visual theme of your application's frame."
            icon={<Palette className="size-4" />}
            layout="split"
          >
            <div className="space-y-8">
               <FieldRadioGroup
                  id="layout-variant"
                  label="Architectural Framework"
                  variant="card"
                  value={variant}
                  onChange={setVariant}
                  contentAlign='center'
                  mediaPosition='start'
                  alignment='end'
                  options={[
                    { value: 'edge', title: 'Edge', description: 'Full-height flush', media: <Monitor className="size-8" /> },
                    { value: 'boxed', title: 'Boxed', description: 'Floating container', media: <LayoutGrid className="size-8" /> },
                    { value: 'two-column', title: 'Double', description: 'Dual-column nav', media: <Columns className="size-8" /> }
                  ]}
               />

               <FieldRadioGroup
                  id="sidebar-appearance"
                  label="Surface Appearance"
                  variant="card"
                  columns={3}
                  value={settings.sidebarAppearance}
                  alignment='end'
                  contentAlign='center'
                  onChange={(v: any) => updateSettings({ sidebarAppearance: v })}
                  options={[
                    { value: 'light', title: 'Light', description: 'Bright' },
                    { value: 'dark', title: 'Dark', description: 'High-contrast' },
                    { value: 'gradient', title: 'Gradient', description: 'Vibrant' },
                  ]}
               />
            </div>
          </FormSection>

          {/* Section 2: Mechanics & Behavior */}
          <FormSection
            title="Interaction Model"
            description="Configure how the navigation system responds to space constraints and user resizing."
            icon={<ToggleRight className="size-4" />}
            layout="split"
          >
            <FieldSwitchGroup
               id="sidebar-mechanics"
               label="Sidebar Mechanics"
               value={[
                 ...(settings.collapsed ? ['collapsed'] : []),
                 ...(settings.enableSidebarResize ? ['resizing'] : [])
               ]}
               onChange={(val) => {
                 updateSettings({
                   collapsed: val.includes('collapsed'),
                   enableSidebarResize: val.includes('resizing')
                 })
               }}
               options={[
                  { 
                     value: 'collapsed', 
                     title: 'Compact Entry Mode', 
                     description: 'Sidebar starts in a collapsed (icons-only) state to maximize content area.'
                  },
                  { 
                     value: 'resizing', 
                     title: 'Precision Edge Resizing', 
                     description: 'Enables a draggable interactive edge for customized navigation width.'
                  }
               ]}
            />


          </FormSection>


          {/* Section 3: Sidebar Composition & Features */}
          <FormSection
            title="Sidebar Content"
            description="Populate the navigation frame with key functional widgets and branding elements."
            icon={<LayoutGrid className="size-4" />}
            layout="split"
          >
            <div className="space-y-10">
               <FieldRadioGroup
                  id="primary-header-widget"
                  label="Header Component"
                  variant="card"
                  value={settings.headerWidget}
                  alignment='end'
                  contentAlign='center'
                  onChange={(v: any) => updateSettings({ headerWidget: v })}
                  options={[
                    { value: 'workspace', title: 'Workspace', description: 'Switch accounts', media: <Database className="size-8" /> },
                    { value: 'user-hero', title: 'User Hero', description: 'Full profile', media: <User className="size-8" /> },
                    { value: 'none', title: 'Empty', description: 'Minimal space', media: <RotateCcw className="size-8" /> },
                  ]}
               />

               <FieldSwitchGroup
                  id="sidebar-features"
                  label="Sidebar Features"
                  value={[
                    ...(settings.footerWidget === 'user-compact' ? ['profile'] : []),
                    ...(settings.showUsage ? ['usage'] : []),
                    ...(settings.showThemeToggler ? ['theme'] : [])
                  ]}
                  onChange={(val) => {
                    updateSettings({
                      footerWidget: val.includes('profile') ? 'user-compact' : 'none',
                      showUsage: val.includes('usage'),
                      showThemeToggler: val.includes('theme')
                    })
                  }}
                  options={[
                        { 
                           value: 'profile', 
                           title: 'Compact Footer Profile', 
                           description: 'Displays user avatar and status at the bottom of the sidebar.'
                        },
                        { 
                           value: 'usage', 
                           title: 'Usage Progress Bar', 
                           description: 'Visual indicator for storage, API quotas, or system limits.'
                        },
                        { 
                           value: 'theme', 
                           title: 'Theme Switching Toggle', 
                           description: 'Quick interaction for users to between light and dark modes.',
                           icon: <SunMoon className="size-4" />
                        }
                  ]}
               />

            </div>
          </FormSection>

          {/* Section 4: Shell Accessories */}
          <FormSection
            title="Side Productivity"
            description="Add auxiliary panels to the right workspace edge for advanced workflows."
            icon={<PanelRight className="size-4" />}
            layout="split"
          >
            <FieldSwitchGroup
               id="right-panel-type"
               label="Productivity Panels"
               value={[
                 ...(settings.rightPanel === 'rail' ? ['rail'] : []),
                 ...(settings.rightPanel === 'dual' ? ['dual'] : [])
               ]}
               onChange={(val) => {
                 // Simple mutually exclusive behavior for this specific setting
                 const lastSelected = val[val.length - 1];
                 updateSettings({ rightPanel: (lastSelected as any) || 'none' });
               }}
               options={[
                 { 
                   value: 'rail', 
                   title: 'Integrated Tool Rail', 
                   description: 'A slim vertical strip for auxiliary navigation and quick-access utility shortcuts.',
                   icon: <PanelRight className="size-4" /> 
                 },
                 { 
                   value: 'dual', 
                   title: 'Contextual Side Pane', 
                   description: 'An expandable secondary workspace panel for complex multi-tasking and deep-dive activity.',
                   icon: <Maximize2 className="size-4" /> 
                 },
               ]}
            />
          </FormSection>
        </div>
      </div>
    </PageLayout>
  );
};

// --- Code Generator Helper ---

const generateCode = (settings: AppLayoutSettings) => {
  return `
/* 
  Katalyst Layout Configuration
  Generated: ${new Date().toLocaleDateString()}
*/

// Implementation logic:
// 1. Your LayoutProvider uses SETTINGS_KEY = 'katalyst-layout-settings'
// 2. These are the current values you should use as defaults:

const initialSettings = ${JSON.stringify(settings, null, 2)};

/*
  The Sidebar component now automatically resolves widgets based on these settings.
  No manual slot passing is required in the playground host!
*/
  `.trim();
};

export default LayoutBuilderContent;
