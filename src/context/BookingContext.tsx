import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface BookingContextValue {
  isOpen: boolean;
  presetServiceId: string;
  /** Открыть форму записи, опционально с предвыбранной услугой. */
  openBooking: (serviceId?: string) => void;
  closeBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [presetServiceId, setPreset] = useState('');

  const openBooking = useCallback((serviceId?: string) => {
    setPreset(serviceId ?? '');
    setOpen(true);
  }, []);
  const closeBooking = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, presetServiceId, openBooking, closeBooking }),
    [isOpen, presetServiceId, openBooking, closeBooking],
  );
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
}
