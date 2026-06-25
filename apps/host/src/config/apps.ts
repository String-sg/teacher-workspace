export type AppColor = 'pink' | 'blue' | 'orange' | 'green' | 'purple';

export interface AppCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: AppColor;
  href: string;
  badge?: string;
}

export interface AppSection {
  id: string;
  title: string;
  description?: string;
  cards: AppCard[];
}

export const featuredCard: AppCard = {
  id: 'featured-students',
  title: 'Students',
  description: 'Holistic insights that help every student thrive',
  icon: '/logos/students-logo.svg',
  color: 'purple',
  href: '/students',
  badge: 'Beta',
};

export const appSections: AppSection[] = [
  {
    id: 'frequently-used',
    title: 'Frequently Used',
    description: 'Your most frequently used daily tools',
    cards: [
      {
        id: 'school-cockpit',
        title: 'School Cockpit',
        description: 'Your central hub for school management and daily operations',
        icon: '/logos/schoolcockpit-logo.svg',
        color: 'blue',
        href: 'https://schoolcockpit.moe.gov.sg',
      },
      {
        id: 'sc-mobile',
        title: 'SC Mobile',
        description: 'Streamlined attendance management on the go',
        icon: '/logos/scmobile-logo.svg',
        color: 'blue',
        href: 'https://scmobile.moe.edu.sg/login',
      },
      {
        id: 'sls',
        title: 'SLS',
        description: 'Teaching and learning platform for curriculum aligned resources',
        icon: '/logos/sls-logo.svg',
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
        icon: '/logos/allears-logo.svg',
        color: 'pink',
        href: 'https://forms.moe.edu.sg',
      },
      {
        id: 'students',
        title: 'Students',
        description: 'Holistic insights that help every student thrive',
        icon: '/logos/students-logo.svg',
        color: 'blue',
        href: '/students',
      },
      {
        id: 'allocate',
        title: 'Allocate',
        description: 'Simplify your Full SBB class allocation',
        icon: '/logos/allocate-logo.svg',
        color: 'blue',
        href: 'https://allocate.digital.moe.gov.sg',
      },
      {
        id: 'sdis',
        title: 'SDIS',
        description:
          'One-stop platform for National School Games, Singapore Youth Festival, Outdoor Adventure Learning Centre, and MOE OBS Challenge',
        icon: '/logos/sdis-logo.svg',
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
        icon: '/logos/mysei-logo.svg',
        color: 'blue',
        href: 'https://mysei.digital.moe.gov.sg',
      },
      {
        id: 'connectogram',
        title: 'Connecto-gram',
        description: 'Social network analysis for student connectedness and peer relationships',
        icon: '/logos/connectogram-logo.svg',
        color: 'blue',
        href: 'https://forms.moe.edu.sg/sna/manage/forms',
      },
      {
        id: 'termly-checkin',
        title: 'Termly Check-In',
        description: 'Regular well-being check-ins to support student mental health',
        icon: '/logos/allears-logo.svg',
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
        icon: '/logos/heytalia-logo.svg',
        color: 'purple',
        href: 'https://pg.moe.edu.sg',
      },
      {
        id: 'appraiser',
        title: 'Appraiser',
        description: 'AI-generated draft student testimonials in seconds',
        icon: '/logos/appraiser-logo.svg',
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
        icon: '/logos/langbuddy-logo.svg',
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
        icon: '/logos/workpal-logo.svg',
        color: 'blue',
        href: 'https://app.workpal.gov.sg',
      },
      {
        id: 'hrp-portal',
        title: 'HR and Payroll portal (HRP)',
        description: 'One-stop platform for staff to manage leave, claims, and HR admin tasks',
        icon: '/logos/hrp-logo.svg',
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
        icon: '/logos/opal-logo.svg',
        color: 'blue',
        href: 'https://idm.opal2.moe.edu.sg',
      },
      {
        id: 'glow',
        title: 'Glow',
        description: 'Bite-sized daily learning in just 5 minutes',
        icon: '/logos/glow-logo.svg',
        color: 'blue',
        href: 'https://glow.digital.moe.gov.sg/home',
      },
    ],
  },
];
