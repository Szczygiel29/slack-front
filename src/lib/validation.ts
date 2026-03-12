const controlCharsRegex = /[\u0000-\u001F\u007F]/;

export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MAX_LENGTH = 128;
export const LANGUAGE_MAX_LENGTH = 32;
export const EMAIL_LIST_ITEM_MAX_LENGTH = 254;
export const EMAIL_LIST_TEXT_MAX_LENGTH = 5000;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const hasControlChars = (value: string) => controlCharsRegex.test(value);

export const isReasonableLength = (value: string, maxLength: number) =>
  value.length <= maxLength;
