import { AppCard, FeaturedAppCard } from '~/components/AppCard';
import type { AppCard as AppCardType } from '~/components/AppCard';

export interface AppSection {
  id: string;
  title: string;
  description?: string;
  cards: AppCardType[];
  featured?: boolean;
}

export function AppSectionView({ title, description, cards, featured }: AppSection) {
  const Card = featured ? FeaturedAppCard : AppCard;

  return (
    <section className="tw:flex tw:flex-col tw:gap-4">
      <div className="tw:flex tw:flex-col tw:gap-1">
        <h2 className="tw:text-lg tw:font-semibold tw:text-foreground">{title}</h2>
        {description && <p className="tw:text-sm tw:text-muted-foreground">{description}</p>}
      </div>
      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.id} {...card} />
        ))}
      </div>
    </section>
  );
}
