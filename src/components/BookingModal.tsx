import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { submitBooking, type BookingPayload } from '../api/booking';
import { phoneHref, siteConfig } from '../config/site';
import { useBooking } from '../context/BookingContext';
import { directionOptionId, hasServiceChoice, serviceLabel, services } from '../data/services';
import { caretAfterDigit, digitsBeforeCaret, extractNational, formatPhone, toE164 } from '../lib/phone';
import { buildSlots, isSlotPast, lastBookingDateISO, todayISO } from '../lib/time';
import { typo } from '../lib/typography';
import {
  FIELD_ORDER,
  validateAll,
  validateField,
  type BookingErrors,
  type BookingField,
  type BookingFormValues,
  type BookingMode,
} from '../lib/validation';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Modal } from './ui/Modal';
import styles from './BookingModal.module.css';

type Status = 'idle' | 'sending' | 'success' | 'not-configured' | 'error';

const EMPTY: BookingFormValues = { mode: 'slot', name: '', phone: '', serviceId: '', date: '', time: '', consent: false };
const FIELD_ID: Record<BookingField, string> = {
  name: 'booking-name',
  phone: 'booking-phone',
  serviceId: 'booking-service',
  date: 'booking-date',
  time: 'booking-time',
  consent: 'booking-consent',
};

export function BookingModal() {
  const { isOpen, presetServiceId, closeBooking } = useBooking();
  const [values, setValues] = useState<BookingFormValues>(EMPTY);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  /** Режим последней успешно отправленной заявки — от него зависит текст подтверждения. */
  const [sentMode, setSentMode] = useState<BookingMode>('slot');
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sendingRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const slots = useMemo(
    () => buildSlots(siteConfig.bookingHours.open, siteConfig.bookingHours.close, siteConfig.bookingHours.stepMinutes),
    [],
  );
  const minDate = isOpen ? todayISO() : '';
  const maxDate = isOpen ? lastBookingDateISO(siteConfig.bookingDaysAhead) : '';
  const isCallback = values.mode === 'callback';

  useEffect(() => {
    if (!isOpen) return;
    setStatus((s) => (s === 'success' || s === 'not-configured' ? 'idle' : s));
    if (presetServiceId) {
      setValues((v) => ({ ...v, serviceId: presetServiceId }));
      setErrors((e) => ({ ...e, serviceId: undefined }));
    }
  }, [isOpen, presetServiceId]);

  const setField = <K extends BookingField>(field: K, value: BookingFormValues[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Ошибку, которая уже показана, пересчитываем сразу — чтобы она исчезла после исправления.
    setErrors((prev) => {
      const updated = { ...prev };
      if (prev[field]) updated[field] = validateField(field, next) || undefined;
      if (field === 'date' && prev.time) updated.time = validateField('time', next) || undefined;
      return updated;
    });
  };

  const setMode = (mode: BookingMode) => {
    setValues((prev) => ({ ...prev, mode }));
    if (mode === 'callback') setErrors((prev) => ({ ...prev, date: undefined, time: undefined }));
  };

  const onBlur = (field: BookingField) => {
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values) || undefined }));
  };

  // Маска телефона: принимает ввод и вставку в форматах +7…, 8…, 9…
  const onPhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const atEnd = caret >= raw.length;
    const national = extractNational(raw);
    const grew = raw.length > values.phone.length;
    const formatted = national ? formatPhone(national) : grew && /\d/.test(raw) ? '+7 (' : '';
    setField('phone', formatted);
    requestAnimationFrame(() => {
      const el = phoneRef.current;
      if (!el || document.activeElement !== el) return;
      const pos = atEnd ? formatted.length : caretAfterDigit(formatted, digitsBeforeCaret(raw, caret));
      el.setSelectionRange(pos, pos);
    });
  };

  const onPhoneKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return;
    const el = event.currentTarget;
    const start = el.selectionStart ?? 0;
    if (start !== el.selectionEnd || start === 0) return;
    const prevChar = el.value[start - 1] ?? '';
    // Удаление по разделителю маски удаляет предыдущую цифру, а не «застревает» на скобке.
    if (!/\d/.test(prevChar)) {
      event.preventDefault();
      const digitIndex = digitsBeforeCaret(el.value, start);
      const national = extractNational(el.value);
      if (digitIndex === 0) {
        setField('phone', '');
        return;
      }
      const nextNational = national.slice(0, digitIndex - 1) + national.slice(digitIndex);
      const formatted = formatPhone(nextNational);
      setField('phone', formatted);
      requestAnimationFrame(() => {
        const pos = caretAfterDigit(formatted, digitIndex - 1);
        phoneRef.current?.setSelectionRange(pos, pos);
      });
    }
  };

  const onPhonePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    const digits = text.replace(/\D/g, '');
    if (digits.length < 10) return;
    event.preventDefault();
    setField('phone', formatPhone(extractNational(text)));
  };

  const focusField = (field: BookingField) => {
    const el = formRef.current?.querySelector<HTMLElement>(`#${FIELD_ID[field]}`);
    el?.focus();
  };

  const send = async () => {
    if (sendingRef.current) return;
    const now = new Date();
    const found = validateAll(values, now);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }
    if (honeypot) {
      console.info('[Aesthetic Body] Заявка отклонена антиспам-фильтром.');
      return;
    }

    const payload: BookingPayload = {
      name: values.name.trim(),
      phone: toE164(extractNational(values.phone)),
      serviceId: values.serviceId,
      serviceTitle: serviceLabel(values.serviceId),
      mode: values.mode,
      ...(values.mode === 'slot' ? { date: values.date, time: values.time } : {}),
      consent: true,
    };

    sendingRef.current = true;
    setStatus('sending');
    setErrorMessage('');
    const result = await submitBooking(payload);
    sendingRef.current = false;

    if (result.status === 'success') {
      setSentMode(values.mode);
      setValues(EMPTY);
      setErrors({});
      setStatus('success');
    } else if (result.status === 'not-configured') {
      setStatus('not-configured');
    } else {
      setErrorMessage(result.message);
      setStatus('error');
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const describedBy = (field: BookingField, hint?: string) =>
    [hint, errors[field] ? `${FIELD_ID[field]}-error` : ''].filter(Boolean).join(' ') || undefined;

  const fieldError = (field: BookingField) =>
    errors[field] ? (
      <p id={`${FIELD_ID[field]}-error`} className={styles.error}>
        {errors[field]}
      </p>
    ) : null;

  useEffect(() => {
    if (status === 'success' || status === 'not-configured') resultRef.current?.focus();
  }, [status]);

  const phone = phoneHref(siteConfig.phone);
  const sending = status === 'sending';
  const showResult = status === 'success' || status === 'not-configured';

  return (
    <Modal
      open={isOpen}
      onClose={closeBooking}
      title={showResult ? (status === 'success' ? 'Заявка отправлена' : 'Запись по телефону') : 'Запись на процедуру'}
      description={showResult ? undefined : typo('Оставьте контакты — администратор перезвонит и подтвердит время.')}
      initialFocusRef={showResult ? undefined : nameRef}
    >
      {status === 'success' && (
        <div ref={resultRef} className={styles.result} role="status" tabIndex={-1}>
          <p className={styles.resultText}>
            {typo(
              sentMode === 'callback'
                ? 'Спасибо! Мы получили вашу заявку. Администратор позвонит, чтобы согласовать удобные дату и время.'
                : 'Спасибо! Мы получили вашу заявку, выбранное время закреплено за вами. Администратор свяжется с вами для подтверждения.',
            )}
          </p>
          <Button onClick={closeBooking}>Закрыть</Button>
        </div>
      )}

      {status === 'not-configured' && (
        <div ref={resultRef} className={styles.result} role="status" tabIndex={-1}>
          <p className={styles.resultText}>
            {typo('Онлайн-запись пока не подключена. Позвоните нам')}
            {siteConfig.phone ? ':' : '.'}
          </p>
          {siteConfig.phone &&
            (phone ? (
              <a href={phone} className={styles.phoneLink}>
                <Icon name="phone" size={22} />
                {siteConfig.phone}
              </a>
            ) : (
              <p className={styles.phoneLink}>
                <Icon name="phone" size={22} />
                {siteConfig.phone}
              </p>
            ))}
          <p className={styles.resultNote}>{typo('Введённые данные сохранены — вы можете вернуться к форме.')}</p>
          <div className={styles.resultActions}>
            {phone && (
              <Button href={phone} arrow>
                Позвонить
              </Button>
            )}
            <Button variant="outline" onClick={() => setStatus('idle')}>
              Вернуться к форме
            </Button>
          </div>
        </div>
      )}

      {!showResult && (
        <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-busy={sending}>
          <div className={styles.field}>
            <label htmlFor={FIELD_ID.name} className={styles.label}>
              Имя
            </label>
            <input
              ref={nameRef}
              id={FIELD_ID.name}
              name="name"
              type="text"
              autoComplete="given-name"
              className={styles.input}
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={() => onBlur('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy('name')}
              aria-required="true"
              maxLength={60}
            />
            {fieldError('name')}
          </div>

          <div className={styles.field}>
            <label htmlFor={FIELD_ID.phone} className={styles.label}>
              Телефон
            </label>
            <input
              ref={phoneRef}
              id={FIELD_ID.phone}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 (___) ___-__-__"
              className={styles.input}
              value={values.phone}
              onChange={onPhoneChange}
              onKeyDown={onPhoneKeyDown}
              onPaste={onPhonePaste}
              onBlur={() => onBlur('phone')}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy('phone')}
              aria-required="true"
            />
            {fieldError('phone')}
          </div>

          <div className={styles.field}>
            <label htmlFor={FIELD_ID.serviceId} className={styles.label}>
              Услуга
            </label>
            <div className={styles.selectWrap}>
              <select
                id={FIELD_ID.serviceId}
                name="service"
                className={styles.input}
                value={values.serviceId}
                onChange={(e) => setField('serviceId', e.target.value)}
                onBlur={() => onBlur('serviceId')}
                aria-invalid={Boolean(errors.serviceId)}
                aria-describedby={describedBy('serviceId')}
                aria-required="true"
              >
                <option value="" disabled>
                  Выберите услугу
                </option>
                {services.map((direction) => (
                  <optgroup key={direction.id} label={direction.title}>
                    {hasServiceChoice(direction) && (
                      <option value={directionOptionId(direction.id)}>{direction.title}: подберём с косметологом</option>
                    )}
                    {direction.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.optionLabel}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <Icon name="arrow-right" size={18} className={styles.selectIcon} />
            </div>
            {fieldError('serviceId')}
          </div>

          <fieldset className={styles.modes}>
            <legend className={styles.label}>Как записаться</legend>
            <div className={styles.modeOptions}>
              <label className={styles.mode}>
                <input
                  type="radio"
                  name="mode"
                  value="slot"
                  className={styles.modeInput}
                  checked={!isCallback}
                  onChange={() => setMode('slot')}
                />
                <span className={styles.modeTitle}>Выбрать дату и время</span>
                <span className={styles.modeNote}>{typo(`онлайн, на ближайшие ${siteConfig.bookingDaysAhead} дней`)}</span>
              </label>
              <label className={styles.mode}>
                <input
                  type="radio"
                  name="mode"
                  value="callback"
                  className={styles.modeInput}
                  checked={isCallback}
                  onChange={() => setMode('callback')}
                />
                <span className={styles.modeTitle}>Оставить заявку</span>
                <span className={styles.modeNote}>{typo('время согласуем по телефону')}</span>
              </label>
            </div>
          </fieldset>

          {!isCallback && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor={FIELD_ID.date} className={styles.label}>
                  Дата
                </label>
                <input
                  id={FIELD_ID.date}
                  name="date"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  className={styles.input}
                  value={values.date}
                  onChange={(e) => setField('date', e.target.value)}
                  onBlur={() => onBlur('date')}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={describedBy('date')}
                  aria-required="true"
                />
                {fieldError('date')}
              </div>

              <div className={styles.field}>
                <label htmlFor={FIELD_ID.time} className={styles.label}>
                  Время
                </label>
                <div className={styles.selectWrap}>
                  <select
                    id={FIELD_ID.time}
                    name="time"
                    className={styles.input}
                    value={values.time}
                    onChange={(e) => setField('time', e.target.value)}
                    onBlur={() => onBlur('time')}
                    aria-invalid={Boolean(errors.time)}
                    aria-describedby={describedBy('time', `${FIELD_ID.time}-hint`)}
                    aria-required="true"
                  >
                    <option value="" disabled>
                      --:--
                    </option>
                    {slots.map((slot) => (
                      <option key={slot} value={slot} disabled={Boolean(values.date) && isSlotPast(values.date, slot)}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  <Icon name="clock" size={18} className={styles.selectIcon} />
                </div>
                <p id={`${FIELD_ID.time}-hint`} className={styles.hint}>
                  Каждые {siteConfig.bookingHours.stepMinutes}&nbsp;минут, {siteConfig.bookingHours.open}–{siteConfig.bookingHours.close}
                </p>
                {fieldError('time')}
              </div>
            </div>
          )}

          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="booking-website">Не заполняйте это поле</label>
            <input
              id="booking-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.consent}>
              <input
                id={FIELD_ID.consent}
                name="consent"
                type="checkbox"
                className={styles.checkbox}
                checked={values.consent}
                onChange={(e) => {
                  setField('consent', e.target.checked);
                  if (e.target.checked) setErrors((prev) => ({ ...prev, consent: undefined }));
                }}
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={describedBy('consent')}
                aria-required="true"
              />
              <label htmlFor={FIELD_ID.consent} className={styles.consentLabel}>
                Я&nbsp;даю согласие на&nbsp;обработку персональных данных в&nbsp;соответствии с&nbsp;
                <a href={siteConfig.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                  политикой конфиденциальности
                </a>
              </label>
            </div>
            {fieldError('consent')}
          </div>

          {status === 'error' && (
            <div className={styles.alert} role="alert">
              <p>{errorMessage}</p>
              <p className={styles.alertNote}>Введённые данные сохранены.</p>
            </div>
          )}

          <Button type="submit" block arrow loading={sending} disabled={sending}>
            {sending
              ? 'Отправляем…'
              : status === 'error'
                ? 'Повторить отправку'
                : isCallback
                  ? 'Отправить заявку'
                  : 'Записаться'}
          </Button>
        </form>
      )}
    </Modal>
  );
}
