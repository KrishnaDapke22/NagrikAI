import { en } from "./en";
import type { TranslationDictionary } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";

export type LanguageCode = "en" | "hi" | "mr";

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en,
  hi,
  mr,
};

export const SUPPORTED_LANGUAGES = [
  { code: "en" as const, label: "English", nativeName: "English", short: "EN" },
  { code: "hi" as const, label: "Hindi", nativeName: "हिंदी", short: "HI" },
  { code: "mr" as const, label: "Marathi", nativeName: "मराठी", short: "MR" },
];

export { en, hi, mr };
export type { TranslationDictionary };
