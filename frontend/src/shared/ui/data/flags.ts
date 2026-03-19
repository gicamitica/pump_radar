import React from 'react';

export type FlagRender = (props?: { className?: string }) => React.ReactElement;

// Lightweight inline SVGs to avoid external assets. These are simplified shapes.
const makeInline = (viewBox: string, body: string) =>
  ((props?: { className?: string }) => (
    React.createElement('svg', { viewBox, className: props?.className ?? '', 'aria-hidden': 'true', focusable: 'false' },
      React.createElement('g', { dangerouslySetInnerHTML: { __html: body } as unknown as never })
    )
  ));

export const Flags: Record<string, FlagRender> = {
  'US': makeInline('0 0 640 480', `
    <defs><clipPath id='a'><path d='M-85.3 0h682.6v512H-85.3z'/></clipPath></defs>
    <g clip-path='url(#a)'>
      <path fill='#bd3d44' d='M-256 0H768v512H-256z'/>
      <path stroke='#fff' stroke-width='40' d='M-256 58.2h1024M-256 136.5h1024M-256 214.8h1024M-256 293h1024M-256 371.3h1024M-256 449.6h1024'/>
      <path fill='#192f5d' d='M-256 0h548.6v350.4H-256z'/>
    </g>`),
  'GB': makeInline('0 0 640 480', `
    <path fill='#012169' d='M0 0h640v480H0z'/>
    <path fill='#fff' d='M75 0l245 180L565 0h75v60L405 240 640 420v60h-75L320 300 75 480H0v-60l235-180L0 60V0h75z'/>
    <path fill='#C8102E' d='M0 0l320 240L640 0'/>
    <path fill='#C8102E' d='M0 480l320-240 320 240'/>
    <path fill='#fff' d='M260 0h120v480H260z'/>
    <path fill='#fff' d='M0 180h640v120H0z'/>
    <path fill='#C8102E' d='M290 0h60v480h-60z'/>
    <path fill='#C8102E' d='M0 210h640v60H0z'/>`),
  'ES': makeInline('0 0 640 480', `
    <path fill='#c60b1e' d='M0 0h640v480H0z'/>
    <path fill='#ffc400' d='M0 120h640v240H0z'/>`),
  'MX': makeInline('0 0 640 480', `
    <path fill='#006847' d='M0 0h213.3v480H0z'/>
    <path fill='#fff' d='M213.3 0h213.4v480H213.3z'/>
    <path fill='#ce1126' d='M426.7 0H640v480H426.7z'/>`),
  'FR': makeInline('0 0 640 480', `
    <path fill='#0055A4' d='M0 0h213.3v480H0z'/>
    <path fill='#fff' d='M213.3 0h213.4v480H213.3z'/>
    <path fill='#EF4135' d='M426.7 0H640v480H426.7z'/>`),
  'BR': makeInline('0 0 640 480', `
    <path fill='#009b3a' d='M0 0h640v480H0z'/>
    <path fill='#ffdf00' d='M320 96L96 240l224 144 224-144z'/>`),
  'IT': makeInline('0 0 640 480', `
    <path fill='#009246' d='M0 0h213.3v480H0z'/>
    <path fill='#fff' d='M213.3 0h213.4v480H213.3z'/>
    <path fill='#ce2b37' d='M426.7 0H640v480H426.7z'/>`),
  'DE': makeInline('0 0 640 480', `
    <path fill='#000' d='M0 0h640v160H0z'/>
    <path fill='#DD0000' d='M0 160h640v160H0z'/>
    <path fill='#FFCE00' d='M0 320h640v160H0z'/>`),
  'JP': makeInline('0 0 640 480', `
    <path fill='#fff' d='M0 0h640v480H0z'/>
    <circle cx='320' cy='240' r='96' fill='#bc002d'/>`),
};

export function getFlagForLocale(code: string): FlagRender | null {
  const parts = code.split('-');
  const region = parts[1]?.toUpperCase();
  const language = parts[0]?.toLowerCase();

  if (region && Flags[region]) return Flags[region];
  // Map some common language->region defaults
  const langDefault: Record<string, string> = {
    en: 'US', es: 'ES', fr: 'FR', pt: 'BR', it: 'IT', de: 'DE', ja: 'JP'
  };
  const fallbackRegion = langDefault[language];
  if (fallbackRegion && Flags[fallbackRegion]) return Flags[fallbackRegion];
  return null;
}
