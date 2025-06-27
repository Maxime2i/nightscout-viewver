import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './public/locales/fr/common.json';
import en from './public/locales/en/common.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { common: fr },
      en: { common: en },
    },
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });

export default i18n;