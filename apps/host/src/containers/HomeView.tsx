import AllEars from '~/assets/logos/allears.svg';
import Allocate from '~/assets/logos/allocate.svg';
import Appraiser from '~/assets/logos/appraiser.svg';
import Connectogram from '~/assets/logos/connectogram.svg';
import Glow from '~/assets/logos/glow.svg';
import Heytalia from '~/assets/logos/heytalia.svg';
import Hrp from '~/assets/logos/hrp.svg';
import Langbuddy from '~/assets/logos/langbuddy.svg';
import Mysei from '~/assets/logos/mysei.svg';
import Opal from '~/assets/logos/opal.svg';
import SchoolCockpit from '~/assets/logos/schoolcockpit.svg';
import ScMobile from '~/assets/logos/scmobile.svg';
import Sdis from '~/assets/logos/sdis.svg';
import Sls from '~/assets/logos/sls.svg';
import Students from '~/assets/logos/students.svg';
import Workpal from '~/assets/logos/workpal.svg';
import { AppCard, FeaturedAppCard } from '~/components/AppCard';
import type { AppCard as AppCardData } from '~/components/AppCard';
import { AppSection } from '~/components/AppSection';
import type { AppSectionProps } from '~/components/AppSection';

type AppSectionData = Pick<AppSectionProps, 'id' | 'title' | 'description' | 'featured'> & {
  cards: AppCardData[];
};

const APP_SECTIONS: AppSectionData[] = [
  {
    id: 'featured',
    title: 'Featured',
    featured: true,
    cards: [
      {
        id: 'featured-students',
        title: 'Student Insights',
        description: 'Holistic insights that help every student thrive',
        icon: Students,
        color: 'purple',
        href: '/students',
        badge: 'Beta',
      },
    ],
  },
  {
    id: 'frequently-used',
    title: 'Frequently Used',
    description: 'Your most frequently used daily tools',
    cards: [
      {
        id: 'school-cockpit',
        title: 'School Cockpit',
        description: 'Your central hub for school management and daily operations',
        icon: SchoolCockpit,
        color: 'blue',
        href: 'https://schoolcockpit.moe.gov.sg',
      },
      {
        id: 'sc-mobile',
        title: 'SC Mobile',
        description: 'Streamlined attendance management on the go',
        icon: ScMobile,
        color: 'blue',
        href: 'https://scmobile.moe.edu.sg/login',
      },
      {
        id: 'sls',
        title: 'SLS',
        description: 'Teaching and learning platform for curriculum aligned resources',
        icon: Sls,
        color: 'green',
        href: 'https://vle.learning.moe.edu.sg/login',
      },
    ],
  },
  {
    id: 'student-information',
    title: 'Student Information',
    description: 'Access and manage student data and records',
    cards: [
      {
        id: 'all-ears',
        title: 'All Ears',
        description: 'Personalised forms for students, staff, and parents',
        icon: AllEars,
        color: 'pink',
        href: 'https://forms.moe.edu.sg',
      },
      {
        id: 'students',
        title: 'Student Insights',
        description: 'Holistic insights that help every student thrive',
        icon: Students,
        color: 'blue',
        href: '/students',
      },
      {
        id: 'allocate',
        title: 'Allocate',
        description: 'Simplify your Full SBB class allocation',
        icon: Allocate,
        color: 'blue',
        href: 'https://allocate.digital.moe.gov.sg',
      },
      {
        id: 'sdis',
        title: 'SDIS',
        description:
          'One-stop platform for National School Games, Singapore Youth Festival, Outdoor Adventure Learning Centre, and MOE OBS Challenge',
        icon: Sdis,
        color: 'blue',
        href: 'https://www.sdis.moe.gov.sg/oalc/s/login',
      },
    ],
  },
  {
    id: 'student-wellbeing',
    title: 'Social-Emotional & Mental Wellbeing (SEConnect)',
    description: 'Tools for social-emotional learning and student wellbeing',
    cards: [
      {
        id: 'mysei',
        title: 'MySEI',
        description: "Holistic insights for students' social-emotional growth & well-being",
        icon: Mysei,
        color: 'blue',
        href: 'https://mysei.digital.moe.gov.sg',
      },
      {
        id: 'connectogram',
        title: 'Connecto-gram',
        description: 'Social network analysis for student connectedness and peer relationships',
        icon: Connectogram,
        color: 'blue',
        href: 'https://forms.moe.edu.sg/sna/manage/forms',
      },
      {
        id: 'termly-checkin',
        title: 'Termly Check-In',
        description: 'Regular well-being check-ins to support student mental health',
        icon: AllEars,
        color: 'blue',
        href: 'https://forms.moe.edu.sg/dashboards',
      },
    ],
  },
  {
    id: 'ai-productivity',
    title: 'AI Productivity Tools',
    description: 'AI-powered tools to boost your productivity',
    cards: [
      {
        id: 'heytalia',
        title: 'HeyTalia',
        description: 'AI-assistant for drafting clear, parent-friendly school communications',
        icon: Heytalia,
        color: 'purple',
        href: 'https://pg.moe.edu.sg',
      },
      {
        id: 'appraiser',
        title: 'Appraiser',
        description: 'AI-generated draft student testimonials in seconds',
        icon: Appraiser,
        color: 'blue',
        href: 'https://smartcompose.gov.sg',
      },
    ],
  },
  {
    id: 'teaching-learning',
    title: 'Teaching & Learning',
    description: 'Tools for teaching, assessment, and learning support',
    cards: [
      {
        id: 'langbuddy',
        title: 'LangBuddy',
        description:
          'AI conversational chatbot for Mother Tongue Language learning for Secondary Schools',
        icon: Langbuddy,
        color: 'blue',
        href: 'https://langbuddy.moe.edu.sg',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Administrative and school management tools',
    cards: [
      {
        id: 'workpal',
        title: 'Workpal',
        description: 'Your workplace management companion',
        icon: Workpal,
        color: 'blue',
        href: 'https://app.workpal.gov.sg',
      },
      {
        id: 'hrp-portal',
        title: 'HR and Payroll portal (HRP)',
        description: 'One-stop platform for staff to manage leave, claims, and HR admin tasks',
        icon: Hrp,
        color: 'blue',
        href: 'https://www.hrp.gov.sg',
      },
    ],
  },
  {
    id: 'professional-development',
    title: 'Professional Development',
    description: 'Professional growth and learning platforms',
    cards: [
      {
        id: 'opal',
        title: 'OPAL 2.0',
        description: 'One-stop portal for professional learning',
        icon: Opal,
        color: 'blue',
        href: 'https://idm.opal2.moe.edu.sg',
      },
      {
        id: 'glow',
        title: 'Glow',
        description: 'Bite-sized daily learning in just 5 minutes',
        icon: Glow,
        color: 'blue',
        href: 'https://glow.digital.moe.gov.sg/home',
      },
    ],
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeView() {
  return (
    <main className="tw:mx-auto tw:flex tw:max-w-3xl tw:flex-col tw:gap-8 tw:px-4 tw:py-8">
      <h1 className="tw:text-center tw:text-2xl tw:font-semibold tw:text-foreground">
        {getGreeting()}
      </h1>

      {APP_SECTIONS.map(({ id, cards, featured, ...rest }) => {
        const Card = featured ? FeaturedAppCard : AppCard;
        return (
          <AppSection key={id} id={id} featured={featured} {...rest}>
            {cards.map((card) => (
              <Card key={card.id} {...card} />
            ))}
          </AppSection>
        );
      })}
    </main>
  );
}
