import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import hu from "./locales/hu/translation.json";

const resources = {
  en: {
    translation: en,
  },
  hu: {
    translation: hu,
  },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    resources,
    lng: "hu", // default language
    fallbackLng: "hu",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
