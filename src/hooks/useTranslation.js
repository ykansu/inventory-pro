import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook to simplify using translations in components
 * @param {string[]} namespaces - Array of namespaces to load
 * @returns {object} - Object containing translation functions and language utilities
 */
export const useTranslation = (namespaces = ['common']) => {
  const { t, i18n } = useI18nTranslation(namespaces);

  /**
   * Change the application language
   * @param {string} language - Language code to change to
   */
  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('appLanguage', language);
  };

  /**
   * Get the list of available languages
   * @returns {string[]} - Array of available language codes
   */
  const getAvailableLanguages = () => {
    return ['en', 'tr']; // Add more languages as they become available
  };

  return {
    t,
    i18n,
    language: i18n.language,
    changeLanguage,
    getAvailableLanguages
  };
};

export default useTranslation;
