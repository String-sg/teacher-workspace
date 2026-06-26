import allEarsLogo from '~/assets/logos/allears-logo.svg';
import allocateLogo from '~/assets/logos/allocate-logo.svg';
import appraiserLogo from '~/assets/logos/appraiser-logo.svg';
import connectogramLogo from '~/assets/logos/connectogram-logo.svg';
import glowLogo from '~/assets/logos/glow-logo.svg';
import heytaliaLogo from '~/assets/logos/heytalia-logo.svg';
import hrpLogo from '~/assets/logos/hrp-logo.svg';
import langbuddyLogo from '~/assets/logos/langbuddy-logo.svg';
import myseiLogo from '~/assets/logos/mysei-logo.svg';
import opalLogo from '~/assets/logos/opal-logo.svg';
import schoolCockpitLogo from '~/assets/logos/schoolcockpit-logo.svg';
import scMobileLogo from '~/assets/logos/scmobile-logo.svg';
import sdisLogo from '~/assets/logos/sdis-logo.svg';
import slsLogo from '~/assets/logos/sls-logo.svg';
import studentsLogo from '~/assets/logos/students-logo.svg';
import workpalLogo from '~/assets/logos/workpal-logo.svg';
import { AppSectionView } from '~/components/AppSectionView';
import type { AppSection } from '~/components/AppSectionView';

const APP_SECTIONS: AppSection[] = [
  {
    id: 'featured',
    title: 'Featured',
    featured: true,
    cards: [
      {
        id: 'featured-students',
        title: 'Students',
        description: 'Holistic insights that help every student thrive',
        icon: studentsLogo,
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
        icon: schoolCockpitLogo,
        color: 'blue',
        href: 'https://schoolcockpit.moe.gov.sg',
      },
      {
        id: 'sc-mobile',
        title: 'SC Mobile',
        description: 'Streamlined attendance management on the go',
        icon: scMobileLogo,
        color: 'blue',
        href: 'https://scmobile.moe.edu.sg/login',
      },
      {
        id: 'sls',
        title: 'SLS',
        description: 'Teaching and learning platform for curriculum aligned resources',
        icon: slsLogo,
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
        icon: allEarsLogo,
        color: 'pink',
        href: 'https://forms.moe.edu.sg',
      },
      {
        id: 'students',
        title: 'Students',
        description: 'Holistic insights that help every student thrive',
        icon: studentsLogo,
        color: 'blue',
        href: '/students',
      },
      {
        id: 'allocate',
        title: 'Allocate',
        description: 'Simplify your Full SBB class allocation',
        icon: allocateLogo,
        color: 'blue',
        href: 'https://allocate.digital.moe.gov.sg',
      },
      {
        id: 'sdis',
        title: 'SDIS',
        description:
          'One-stop platform for National School Games, Singapore Youth Festival, Outdoor Adventure Learning Centre, and MOE OBS Challenge',
        icon: sdisLogo,
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
        icon: myseiLogo,
        color: 'blue',
        href: 'https://mysei.digital.moe.gov.sg',
      },
      {
        id: 'connectogram',
        title: 'Connecto-gram',
        description: 'Social network analysis for student connectedness and peer relationships',
        icon: connectogramLogo,
        color: 'blue',
        href: 'https://forms.moe.edu.sg/sna/manage/forms',
      },
      {
        id: 'termly-checkin',
        title: 'Termly Check-In',
        description: 'Regular well-being check-ins to support student mental health',
        icon: allEarsLogo,
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
        icon: heytaliaLogo,
        color: 'purple',
        href: 'https://pg.moe.edu.sg',
      },
      {
        id: 'appraiser',
        title: 'Appraiser',
        description: 'AI-generated draft student testimonials in seconds',
        icon: appraiserLogo,
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
        icon: langbuddyLogo,
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
        icon: workpalLogo,
        color: 'blue',
        href: 'https://app.workpal.gov.sg',
      },
      {
        id: 'hrp-portal',
        title: 'HR and Payroll portal (HRP)',
        description: 'One-stop platform for staff to manage leave, claims, and HR admin tasks',
        icon: hrpLogo,
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
        icon: opalLogo,
        color: 'blue',
        href: 'https://idm.opal2.moe.edu.sg',
      },
      {
        id: 'glow',
        title: 'Glow',
        description: 'Bite-sized daily learning in just 5 minutes',
        icon: glowLogo,
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

      {APP_SECTIONS.map((section) => (
        <AppSectionView key={section.id} {...section} />
      ))}
    </main>
  );
}
