import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en_common from "@/i18n/locales/en/common.json";
import en_dashboard from "@/i18n/locales/en/home.json";
import en_auth from "@/i18n/locales/en/auth.json";
import en_settings from "@/i18n/locales/en/settings.json";
import en_notifications from "@/i18n/locales/en/notifications.json";
import en_system from "@/i18n/locales/en/system.json";
import en_guidedSetup from "@/i18n/locales/en/guidedSetup.json";
import en_activityHub from "@/i18n/locales/en/activityHub.json";
import en_pricing from "@/i18n/locales/en/pricing.json";
import en_errors from "@/i18n/locales/en/errors.json";
import en_layouts from "@/i18n/locales/en/layouts.json";
import en_navigation from "@/i18n/locales/en/navigation.json";

import es_common from "@/i18n/locales/es/common.json";
import es_dashboard from "@/i18n/locales/es/home.json";
import es_auth from "@/i18n/locales/es/auth.json";
import es_system from "@/i18n/locales/es/system.json";
import es_guidedSetup from "@/i18n/locales/es/guidedSetup.json";
import es_activityHub from "@/i18n/locales/es/activityHub.json";
import es_pricing from "@/i18n/locales/es/pricing.json";
import es_errors from "@/i18n/locales/es/errors.json";
import es_layouts from "@/i18n/locales/es/layouts.json";
import es_navigation from "@/i18n/locales/es/navigation.json";

import ptBR_common from "@/i18n/locales/pt-BR/common.json";
import ptBR_dashboard from "@/i18n/locales/pt-BR/home.json";
import ptBR_auth from "@/i18n/locales/pt-BR/auth.json";
import ptBR_system from "@/i18n/locales/pt-BR/system.json";
import ptBR_guidedSetup from "@/i18n/locales/pt-BR/guidedSetup.json";
import ptBR_activityHub from "@/i18n/locales/pt-BR/activityHub.json";
import ptBR_pricing from "@/i18n/locales/pt-BR/pricing.json";
import ptBR_errors from "@/i18n/locales/pt-BR/errors.json";
import ptBR_layouts from "@/i18n/locales/pt-BR/layouts.json";
import ptBR_navigation from "@/i18n/locales/pt-BR/navigation.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    resources: {
      en: {
        common: en_common,
        dashboard: en_dashboard,
        home: en_dashboard,
        auth: en_auth,
        settings: en_settings,
        notifications: en_notifications,
        system: en_system,
        guidedSetup: en_guidedSetup,
        activityHub: en_activityHub,
        pricing: en_pricing,
        errors: en_errors,
        layouts: en_layouts,
        navigation: en_navigation,
      },
      es: {
        common: es_common,
        dashboard: es_dashboard,
        home: es_dashboard,
        auth: es_auth,
        system: es_system,
        guidedSetup: es_guidedSetup,
        activityHub: es_activityHub,
        pricing: es_pricing,
        errors: es_errors,
        layouts: es_layouts,
        navigation: es_navigation,
      },
      "pt-BR": {
        common: ptBR_common,
        dashboard: ptBR_dashboard,
        home: ptBR_dashboard,
        auth: ptBR_auth,
        system: ptBR_system,
        guidedSetup: ptBR_guidedSetup,
        activityHub: ptBR_activityHub,
        pricing: ptBR_pricing,
        errors: ptBR_errors,
        layouts: ptBR_layouts,
        navigation: ptBR_navigation,
      },
    },
    defaultNS: "common",
    ns: [
      "common",
      "dashboard",
      "home",
      "users",
      "auth",
      "settings",
      "calendar",
      "chat",
      "email",
      "dashboards",
      "kanban",
      "notifications",
      "teams",
      "invoices",
      "system",
      "guidedSetup",
      "activityHub",
      "integrations",
      "pricing",
      "errors",
      "layouts",
      "navigation",
      "inbox",
    ],
  });

export default i18n;
