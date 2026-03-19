import { AUTH_PATHS_MINIMAL, AUTH_PATHS_HERO } from '@/modules/auth/ui/routes/paths';

type Page = 'login' | 'register' | 'forgot' | 'reset' | 'verify' | 'mfaSetup' | 'mfaVerify';

type Variant = 'minimal' | 'hero';

export function nextLink(page: Page, variant: Variant) {
  if (variant === 'minimal') {
    switch (page) {
      case 'login': return { to: AUTH_PATHS_MINIMAL.REGISTER, labelKey: 'createOne' };
      case 'register': return { to: AUTH_PATHS_MINIMAL.LOGIN, labelKey: 'alreadyHave' };
      case 'forgot':
      case 'reset':
      case 'verify':
      case 'mfaSetup':
      case 'mfaVerify':
        return { to: AUTH_PATHS_MINIMAL.LOGIN, labelKey: 'backLogin' };
    }
  } else {
    switch (page) {
      case 'login': return { to: AUTH_PATHS_HERO.REGISTER_HERO, labelKey: 'createOne' };
      case 'register': return { to: AUTH_PATHS_HERO.LOGIN_HERO, labelKey: 'alreadyHave' };
      case 'forgot':
      case 'reset':
      case 'verify':
      case 'mfaSetup':
      case 'mfaVerify':
        return { to: AUTH_PATHS_HERO.LOGIN_HERO, labelKey: 'backLogin' };
    }
  }
}
