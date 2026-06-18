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
}

export const categories: Array<'All' | Category> = [
  'All',
  'Web Apps',
  'Web Design',
  'E-Commerce',
]

export const projects: Project[] = [
  {
    id: 'meridian',
    title: 'Meridian Capital',
    category: 'Web Apps',
    domain: 'meridiancapital.io',
    href: '#',
    gradient: 'linear-gradient(135deg, #060e20 0%, #0d2040 50%, #0a1830 100%)',
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
    id: 'apex',
    title: 'Apex Commerce',
    category: 'E-Commerce',
    domain: 'apexcommerce.shop',
    href: '#',
    gradient: 'linear-gradient(135deg, #150820 0%, #220d38 50%, #180a30 100%)',
  },
  {
    id: 'orbit',
    title: 'Orbit SaaS',
    category: 'Web Apps',
    domain: 'orbitapp.io',
    href: '#',
    gradient: 'linear-gradient(135deg, #080e28 0%, #102040 55%, #0c1830 100%)',
  },
  {
    id: 'bloom',
    title: 'Bloom Beauty',
    category: 'E-Commerce',
    domain: 'bloombeauty.com',
    href: '#',
    gradient: 'linear-gradient(135deg, #180820 0%, #280d30 55%, #1c0a28 100%)',
  },
  {
    id: 'nova',
    title: 'Nova Landing',
    category: 'Web Design',
    domain: 'novastartup.io',
    href: '#',
    gradient: 'linear-gradient(135deg, #060e22 0%, #0e1a40 55%, #091530 100%)',
  },
]
