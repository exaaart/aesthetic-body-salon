import { hasServiceChoice, services, type ServiceDirection } from '../data/services';
import { typo } from '../lib/typography';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import styles from './ServicesPanel.module.css';

interface ServicesPanelProps {
  state: null | 'all' | string;
  onClose: () => void;
  onBook: (direction: ServiceDirection) => void;
  onBookItem: (serviceId: string) => void;
}

function ServiceList({
  direction,
  onBookItem,
  headingLevel,
}: {
  direction: ServiceDirection;
  onBookItem: (serviceId: string) => void;
  headingLevel?: 'h3';
}) {
  const HeadingTag = headingLevel;
  return (
    <div className={styles.group}>
      {HeadingTag && <HeadingTag className={styles.groupTitle}>{direction.title}</HeadingTag>}
      {direction.priceNote && <p className={styles.priceNote}>{typo(direction.priceNote)}</p>}
      <ul className={styles.list}>
        {direction.items.map((item) => (
          <li key={item.id} className={styles.row}>
            <div className={styles.rowText}>
              <span className={styles.rowName}>{typo(item.name)}</span>
              {item.note && <span className={styles.rowNote}>{typo(item.note)}</span>}
            </div>
            {item.price && <span className={styles.price}>{item.price}</span>}
            <button
              type="button"
              className={styles.rowBook}
              onClick={() => onBookItem(item.id)}
              aria-label={`Записаться: ${item.name}`}
            >
              Записаться
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServicesPanel({ state, onClose, onBook, onBookItem }: ServicesPanelProps) {
  const direction = state && state !== 'all' ? services.find((d) => d.id === state) : undefined;
  const showAll = state === 'all';
  const open = showAll || Boolean(direction);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={showAll ? 'Все услуги' : direction?.title ?? ''}
      description={showAll ? typo('Все процедуры и цены салона. Выберите услугу, и мы откроем форму записи.') : direction && typo(direction.summary)}
    >
      {showAll &&
        services.map((d) => (
          <section key={d.id} className={styles.section} aria-label={d.title}>
            <ServiceList direction={d} onBookItem={onBookItem} headingLevel="h3" />
          </section>
        ))}

      {direction && (
        <>
          <ServiceList direction={direction} onBookItem={onBookItem} />
          <div className={styles.footer}>
            <p className={styles.hint}>
              {typo(
                hasServiceChoice(direction)
                  ? 'Не знаете, что выбрать? Запишитесь на направление — косметолог подберёт процедуру на месте.'
                  : 'Выберите удобные дату и время в форме записи.',
              )}
            </p>
            <Button arrow onClick={() => onBook(direction)}>
              Записаться
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
