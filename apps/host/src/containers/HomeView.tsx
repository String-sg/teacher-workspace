import { FeaturedAppCard } from '~/components/AppCard';
import { AppSectionView } from '~/components/AppSection';
import { appSections, featuredCard } from '~/config/apps';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeView() {
  return (
    <main className="tw:mx-auto tw:flex tw:max-w-[760px] tw:flex-col tw:gap-8 tw:px-4 tw:py-8">
      <h1 className="tw:py-0 tw:text-center tw:text-2xl tw:font-semibold tw:text-foreground">
        {getGreeting()}
      </h1>

      <section className="tw:flex tw:flex-col tw:gap-4">
        <h2 className="tw:text-lg tw:font-semibold tw:text-foreground">Featured</h2>
        <FeaturedAppCard {...featuredCard} />
      </section>

      {appSections.map((section) => (
        <AppSectionView key={section.id} {...section} />
      ))}
    </main>
  );
}
