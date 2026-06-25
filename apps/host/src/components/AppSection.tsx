import { AppCard } from '~/components/AppCard';
import type { AppSection } from '~/config/apps';

export function AppSectionView({ title, description, cards }: AppSection) {
  return (
    <section className="tw:flex tw:flex-col tw:gap-4">
      <div className="tw:flex tw:flex-col tw:gap-1">
        <h2 className="tw:text-lg tw:font-semibold tw:text-foreground">{title}</h2>
        {description && <p className="tw:text-sm tw:text-muted-foreground">{description}</p>}
      </div>
      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-3">
        {cards.map((card) => (
          <AppCard key={card.id} {...card} />
        ))}
      </div>
    </section>
  );
}
