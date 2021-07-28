import alpha2ToAlpha3Langs from './languages';

/**
  * Takes a locale (e.g. "en-us") and returns an
  * ISO 639-2 language code.
  *
  * @param {*} locale
  * @returns
  */
export function localeToLang (locale) {
  return alpha2ToAlpha3Langs[locale.split('-')[0]];
}