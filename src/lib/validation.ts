import { extractNational, isValidNational } from './phone';
import { siteConfig } from '../config/site';
import { isDatePast, isSlotPast, lastBookingDateISO } from './time';

/** slot — запись на конкретные дату и время; callback — заявка, время согласуют по телефону. */
export type BookingMode = 'slot' | 'callback';

export interface BookingFormValues {
  mode: BookingMode;
  name: string;
  phone: string;
  serviceId: string;
  date: string;
  time: string;
  consent: boolean;
}

export type BookingField = Exclude<keyof BookingFormValues, 'mode'>;
export type BookingErrors = Partial<Record<BookingField, string>>;

export const FIELD_ORDER: BookingField[] = ['name', 'phone', 'serviceId', 'date', 'time', 'consent'];

const NAME_RE = /^[\p{L}][\p{L}\s'’.-]*$/u;

export const validateField = (field: BookingField, values: BookingFormValues, now: Date = new Date()): string => {
  switch (field) {
    case 'name': {
      const name = values.name.trim();
      if (!name) return 'Укажите имя';
      if (/\d/.test(name)) return 'Имя не должно содержать цифры';
      if (name.length < 2) return 'Имя должно быть не короче двух букв';
      if (!NAME_RE.test(name)) return 'Используйте только буквы, пробел или дефис';
      return '';
    }
    case 'phone': {
      const national = extractNational(values.phone);
      if (!national) return 'Укажите телефон';
      if (national.length < 10) return 'Номер неполный: нужно 10 цифр после +7';
      if (!isValidNational(national)) return 'Проверьте номер: российские номера начинаются с 3, 4, 8 или 9';
      return '';
    }
    case 'serviceId':
      return values.serviceId ? '' : 'Выберите услугу';
    case 'date': {
      if (values.mode === 'callback') return '';
      if (!values.date) return 'Выберите дату';
      if (isDatePast(values.date, now)) return 'Дата уже прошла — выберите сегодня или позже';
      if (values.date > lastBookingDateISO(siteConfig.bookingDaysAhead, now)) {
        return `Онлайн-запись открыта на ${siteConfig.bookingDaysAhead} дней вперёд. Для более поздней даты оставьте заявку без даты — согласуем время по телефону`;
      }
      return '';
    }
    case 'time':
      if (values.mode === 'callback') return '';
      if (!values.time) return 'Выберите время';
      if (values.date && isSlotPast(values.date, values.time, now)) return 'Это время уже прошло — выберите более позднее';
      return '';
    case 'consent':
      return values.consent ? '' : 'Нужно согласие на обработку персональных данных';
    default:
      return '';
  }
};

export const validateAll = (values: BookingFormValues, now: Date = new Date()): BookingErrors => {
  const errors: BookingErrors = {};
  for (const field of FIELD_ORDER) {
    const message = validateField(field, values, now);
    if (message) errors[field] = message;
  }
  return errors;
};
