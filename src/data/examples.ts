export type Category = 'Web Apps' | 'Web Design' | 'E-Commerce'

export type Project = {
  id: string
  title: string
  category: Category
  /** Domain shown in the card's browser bar. */
  domain: string
  /** Placeholder destination — swap for the real demo URLs later. */
  href: string
  /** Placeholder gradient for the card "screenshot". */
  gradient: string
  /**
   * Real screenshot. When set (e.g. '/images/meridian.jpg'), the gradient
   * placeholder is replaced automatically. Drop files in /public/images.
   */
  image?: string
  /** Site sends X-Frame-Options/CSP that blocks iframes — show the screenshot in the modal instead of embedding. */
  noEmbed?: boolean
}

export const categories: Array<'All' | Category> = [
  'All',
  'Web Apps',
  'Web Design',
  'E-Commerce',
]

export const projects: Project[] = [
  {
    id: 'dulbina',
    title: 'Дълбина',
    category: 'E-Commerce',
    domain: 'dulbina-dive-example.vercel.app',
    href: 'https://dulbina-dive-example.vercel.app/',
    gradient: 'linear-gradient(135deg, #03090e 0%, #062a3a 50%, #04161f 100%)',
  },
  {
    id: 'yuzhen-park',
    title: 'Южен Парк Резиденс',
    category: 'Web Design',
    domain: 'yuzhen-park-residence-example.vercel.app',
    href: 'https://yuzhen-park-residence-example.vercel.app/',
    gradient: 'linear-gradient(135deg, #2a251d 0%, #4a4033 50%, #332c22 100%)',
  },
  {
    id: 'yourbrand',
    title: 'YourBrand Studio',
    category: 'Web Design',
    domain: 'mainexample.vercel.app',
    href: 'https://mainexample.vercel.app/',
    gradient: 'linear-gradient(135deg, #0d0820 0%, #1a0e38 50%, #0f0a28 100%)',
    image: '/images/yourbrand.jpg',
  },
  {
    id: 'veridian',
    title: 'Veridian & Partners',
    category: 'Web Design',
    domain: 'lawyer-site-viewonly.vercel.app',
    href: 'https://lawyer-site-viewonly.vercel.app/en',
    gradient: 'linear-gradient(135deg, #0d0a20 0%, #1c1238 50%, #120c28 100%)',
    image: '/images/veridian.jpg',
  },
  {
    id: 'studio-construction',
    title: 'Studio Construction',
    category: 'Web Design',
    domain: 'studio-construction.vercel.app',
    href: 'https://studio-construction.vercel.app/',
    gradient: 'linear-gradient(135deg, #100a1c 0%, #201236 50%, #160c26 100%)',
    image: '/images/studio-construction.jpg',
  },
  {
    id: 'lumiere',
    title: 'Lumière',
    category: 'Web Design',
    domain: 'lumiere-mocha.vercel.app',
    href: 'https://lumiere-mocha.vercel.app/',
    gradient: 'linear-gradient(135deg, #160a20 0%, #2a1238 50%, #1c0c2a 100%)',
    image: '/images/lumiere.jpg',
  },
  {
    id: 'aurora',
    title: 'Aurora Coffee Roasters',
    category: 'E-Commerce',
    domain: 'aurora-phi-wine.vercel.app',
    href: 'https://aurora-phi-wine.vercel.app/',
    gradient: 'linear-gradient(135deg, #200a18 0%, #380d28 50%, #28081c 100%)',
    image: '/images/aurora.jpg',
  },
]
