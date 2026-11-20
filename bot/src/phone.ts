/** Российский номер: принимает +7…, 8…, 7… или 10 цифр; хранится в E.164. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let national = digits;
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) national = digits.slice(1);
  if (!/^[3489]\d{9}$/.test(national)) return null;
  return `+7${national}`;
}

/** +79123456789 → +7 (912) 345-67-89 */
export function formatPhone(e164: string): string {
  const n = e164.replace(/\D/g, '').slice(-10);
  if (n.length !== 10) return e164;
  return `+7 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6, 8)}-${n.slice(8)}`;
}
