/** Извлекает 10 цифр номера без кода страны из любого ввода (+7…, 8…, 9…). */
export const extractNational = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const hasCountryCode =
    raw.trimStart().startsWith('+7') ||
    ((digits.startsWith('7') || digits.startsWith('8')) && (digits.length === 1 || digits.length >= 11));
  return (hasCountryCode ? digits.slice(1) : digits).slice(0, 10);
};

/** Форматирует национальную часть по маске +7 (___) ___-__-__ без хвостовых символов. */
export const formatPhone = (national: string): string => {
  if (!national) return '';
  const a = national.slice(0, 3);
  const b = national.slice(3, 6);
  const c = national.slice(6, 8);
  const d = national.slice(8, 10);
  let out = `+7 (${a}`;
  if (national.length >= 3) out += ')';
  if (b) out += ` ${b}`;
  if (c) out += `-${c}`;
  if (d) out += `-${d}`;
  return out;
};

/** Позиция курсора в отформатированной строке после n-й цифры национальной части. */
export const caretAfterDigit = (formatted: string, digitIndex: number): number => {
  if (digitIndex <= 0) return Math.min(formatted.length, 4);
  let seen = 0;
  // Первые 2 символа «+7» не относятся к национальной части.
  for (let i = 2; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i] ?? '')) {
      seen += 1;
      if (seen === digitIndex) return i + 1;
    }
  }
  return formatted.length;
};

/** Количество цифр национальной части слева от позиции курсора. */
export const digitsBeforeCaret = (value: string, caret: number): number =>
  value.slice(0, caret).slice(2).replace(/\D/g, '').length;

export const isValidNational = (national: string): boolean => /^[3489]\d{9}$/.test(national);

export const toE164 = (national: string): string => `+7${national}`;
