import { Product, CategoryMeta, Coupon, HeroSlide, Order, Address, UserProfile } from '../types';

export const initialCategories: CategoryMeta[] = [
  {
    id: 'cat-jewellery',
    title: 'Jewellery & Accessories',
    slug: 'apparel',
    subtitle: 'Discover jewellery and accessories that bring elegance and charm to everyday moments.',
    heroImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&fit=crop&auto=format',
    bannerImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&fit=crop&auto=format',
    priority: 1,
    subcategories: ['All', 'Necklaces', 'Earrings', 'Bangles & Bracelets', 'Rings', 'Pendants & Sets', 'Bridal & Heritage'],
    subcatImages: [
      { name: 'Necklaces', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&fit=crop&auto=format' },
      { name: 'Earrings', image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&fit=crop&auto=format' },
      { name: 'Bangles & Bracelets', image: 'https://images.unsplash.com/photo-1611591475143-be232563e414?w=600&fit=crop&auto=format' },
      { name: 'Rings', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&fit=crop&auto=format' },
      { name: 'Pendants & Sets', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&fit=crop&auto=format' },
      { name: 'Bridal & Heritage', image: 'https://images.unsplash.com/photo-1515562141589-67f0d0953a8e?w=600&fit=crop&auto=format' },
    ],
  },
  {
    id: 'cat-candles',
    title: 'Candle & Home Fragrance',
    slug: 'Fragrance',
    subtitle: 'Explore pearl wax and home fragrance essentials to create a warm, inviting atmosphere.',
    heroImage: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1200&fit=crop&auto=format',
    bannerImage: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1200&fit=crop&auto=format',
    priority: 2,
    subcategories: ['All', 'Soy Wax Candles', 'Reed Diffusers', 'Incense & Dhoop', 'Room Sprays'],
    subcatImages: [
      { name: 'Soy Wax Candles', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&fit=crop&auto=format' },
      { name: 'Reed Diffusers', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&fit=crop&auto=format' },
      { name: 'Incense & Dhoop', image: 'https://images.unsplash.com/photo-1602928321679-560b4139c907?w=600&fit=crop&auto=format' },
      { name: 'Room Sprays', image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600&fit=crop&auto=format' },
    ],
  },
  {
    id: 'cat-lifestyle',
    title: 'Home Décor & Lifestyle',
    slug: 'Lifestyle',
    subtitle: 'Discover thoughtfully selected décor and lifestyle essentials to make your space feel special.',
    heroImage: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=1200&fit=crop&auto=format',
    bannerImage: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=1200&fit=crop&auto=format',
    priority: 3,
    subcategories: ['All', 'Brassware & Idols', 'Vases & Planters', 'Tabletop & Trays', 'Wall Art & Mirrors'],
    subcatImages: [
      { name: 'Brassware & Idols', image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&fit=crop&auto=format' },
      { name: 'Vases & Planters', image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&fit=crop&auto=format' },
      { name: 'Tabletop & Trays', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&fit=crop&auto=format' },
      { name: 'Wall Art & Mirrors', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&fit=crop&auto=format' },
    ],
  },
  {
    id: 'cat-wellness',
    title: 'Organic & Wellness',
    slug: 'Wellness',
    subtitle: 'Explore organic products and wellness essentials for a more mindful everyday lifestyle.',
    heroImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&fit=crop&auto=format',
    bannerImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&fit=crop&auto=format',
    priority: 4,
    subcategories: ['All', 'Ayurvedic Oils & Skincare', 'Herbal Teas', 'Wellness Elixirs', 'Bath Salts'],
    subcatImages: [
      { name: 'Ayurvedic Oils & Skincare', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&fit=crop&auto=format' },
      { name: 'Herbal Teas', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&fit=crop&auto=format' },
      { name: 'Wellness Elixirs', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&fit=crop&auto=format' },
      { name: 'Bath Salts', image: 'https://images.unsplash.com/photo-1512290900673-7002b5217615?w=600&fit=crop&auto=format' },
    ],
  },
  {
    id: 'cat-gift',
    title: 'Gift & Stationery',
    slug: 'Gift',
    subtitle: 'Find thoughtful gifts and stationery to celebrate special moments and make every occasion memorable.',
    heroImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1200&fit=crop&auto=format',
    bannerImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1200&fit=crop&auto=format',
    priority: 5,
    subcategories: ['All', 'Bespoke Gift Boxes', 'Handmade Journals', 'Greeting Cards', 'Festive Hampers'],
    subcatImages: [
      { name: 'Bespoke Gift Boxes', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&fit=crop&auto=format' },
      { name: 'Handmade Journals', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&fit=crop&auto=format' },
      { name: 'Greeting Cards', image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&fit=crop&auto=format' },
      { name: 'Festive Hampers', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&fit=crop&auto=format' },
    ],
  },
];
export const initialProducts: Product[] = [];
export const initialCoupons: Coupon[] = [];
export const initialHeroSlides: HeroSlide[] = [
  {
    id: 'banner-kundan-heirloom',
    pretitle: 'Jewels That Tell Your Story',
    title: 'Jewellery & Accessories',
    subtitle: 'Discover jewellery and accessories that bring elegance and charm to everyday moments and special occasions.',
    ctaText: 'Explore Collection',
    ctaLink: '/category/apparel',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1920&q=80',
    active: true,
    priority: 1,
  },
  {
    id: 'banner-temple-bridal',
    pretitle: 'Create a Space That Feels Like You',
    title: 'Candle & Home Fragrance',
    subtitle: 'Explore pearl wax and home fragrance essentials to create a warm, inviting atmosphere.',
    ctaText: 'Explore Collection',
    ctaLink: '/category/Fragrance',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1920&q=80',
    active: true,
    priority: 2,
  },
  {
    id: 'banner-1790602077120',
    pretitle: 'Beautiful Things for Beautiful Spaces',
    title: 'Home Décor & Lifestyle',
    subtitle: 'Discover thoughtfully selected décor and lifestyle essentials to make your space feel special.',
    ctaText: 'Explore Collection',
    ctaLink: '/category/Lifestyle',
    image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1920&q=80',
    active: true,
    priority: 3,
  },
  {
    id: 'banner-1790602201616',
    pretitle: 'Pure Choices for Everyday Wellbeing',
    title: 'Organic & Wellness',
    subtitle: 'Explore organic products and wellness essentials for a more mindful everyday lifestyle.',
    ctaText: 'Explore Collection',
    ctaLink: '/category/Wellness',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=80',
    active: true,
    priority: 4,
  },
  {
    id: 'banner-artisanal-living',
    pretitle: 'Thoughtful Gifts. Meaningful Moments.',
    title: 'Gift & Stationery',
    subtitle: 'Find thoughtful gifts and stationery to celebrate special moments and make every occasion memorable.',
    ctaText: 'Explore Collection',
    ctaLink: '/category/Gift',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=1920&q=80',
    active: true,
    priority: 5,
  },
];

export const initialUser: UserProfile = {
  name: '',
  email: '',
  phone: '',
};

export const initialAddresses: Address[] = [];
export const initialOrders: Order[] = [];

export const DEFAULT_SUBCAT_PHOTOS: Record<string, string> = {
  // Jewellery & Accessories (apparel)
  'necklaces': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&fit=crop&auto=format',
  'earrings': 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&fit=crop&auto=format',
  'bangles & bracelets': 'https://images.unsplash.com/photo-1611591475143-be232563e414?w=600&fit=crop&auto=format',
  'bangles': 'https://images.unsplash.com/photo-1611591475143-be232563e414?w=600&fit=crop&auto=format',
  'bracelets': 'https://images.unsplash.com/photo-1611591475143-be232563e414?w=600&fit=crop&auto=format',
  'rings': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&fit=crop&auto=format',
  'pendants & sets': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&fit=crop&auto=format',
  'pendants': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&fit=crop&auto=format',
  'bridal & heritage': 'https://images.unsplash.com/photo-1515562141589-67f0d0953a8e?w=600&fit=crop&auto=format',
  'bridal': 'https://images.unsplash.com/photo-1515562141589-67f0d0953a8e?w=600&fit=crop&auto=format',

  // Candle & Home Fragrance (Fragrance)
  'soy wax candles': 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&fit=crop&auto=format',
  'candles': 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&fit=crop&auto=format',
  'reed diffusers': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&fit=crop&auto=format',
  'diffusers': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&fit=crop&auto=format',
  'incense & dhoop': 'https://images.unsplash.com/photo-1602928321679-560b4139c907?w=600&fit=crop&auto=format',
  'incense': 'https://images.unsplash.com/photo-1602928321679-560b4139c907?w=600&fit=crop&auto=format',
  'dhoop': 'https://images.unsplash.com/photo-1602928321679-560b4139c907?w=600&fit=crop&auto=format',
  'room sprays': 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600&fit=crop&auto=format',
  'sprays': 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600&fit=crop&auto=format',

  // Home Decor & Lifestyle (Lifestyle)
  'brassware & idols': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&fit=crop&auto=format',
  'brassware': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&fit=crop&auto=format',
  'idols': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&fit=crop&auto=format',
  'vases & planters': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&fit=crop&auto=format',
  'vases': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&fit=crop&auto=format',
  'planters': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&fit=crop&auto=format',
  'tabletop & trays': 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&fit=crop&auto=format',
  'trays': 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&fit=crop&auto=format',
  'wall art & mirrors': 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&fit=crop&auto=format',
  'mirrors': 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&fit=crop&auto=format',
  'wall art': 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&fit=crop&auto=format',

  // Organic & Wellness (Wellness)
  'ayurvedic oils & skincare': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&fit=crop&auto=format',
  'ayurvedic oils': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&fit=crop&auto=format',
  'skincare': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&fit=crop&auto=format',
  'herbal teas': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&fit=crop&auto=format',
  'teas': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&fit=crop&auto=format',
  'wellness elixirs': 'https://images.unsplash.com/photo-1512290900673-7002b5217615?w=600&fit=crop&auto=format',
  'elixirs': 'https://images.unsplash.com/photo-1512290900673-7002b5217615?w=600&fit=crop&auto=format',
  'bath salts': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&fit=crop&auto=format',

  // Gift & Stationery (Gift)
  'bespoke gift boxes': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&fit=crop&auto=format',
  'gift boxes': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&fit=crop&auto=format',
  'handmade journals': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&fit=crop&auto=format',
  'journals': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&fit=crop&auto=format',
  'greeting cards': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&fit=crop&auto=format',
  'cards': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&fit=crop&auto=format',
  'festive hampers': 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&fit=crop&auto=format',
  'hampers': 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&fit=crop&auto=format',
};

export function getSubcategoryImage(name: string, catHero?: string, currentImage?: string): string {
  const cleanName = (name || '').trim().toLowerCase().replace(/é/g, 'e');
  const cleanImg = (currentImage || '').trim();
  const cleanHero = (catHero || '').trim();

  // If cleanImg exists, is valid URL, and is NOT identical to cleanHero, use it!
  if (cleanImg && cleanImg !== cleanHero && (cleanImg.startsWith('http://') || cleanImg.startsWith('https://') || cleanImg.startsWith('data:image/'))) {
    return cleanImg;
  }

  // Exact key match
  if (DEFAULT_SUBCAT_PHOTOS[cleanName]) {
    return DEFAULT_SUBCAT_PHOTOS[cleanName];
  }

  // Partial key match
  for (const [key, url] of Object.entries(DEFAULT_SUBCAT_PHOTOS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return url;
    }
  }

  // Fallback to non-hero cleanImg or cleanHero or generic luxury photo
  return (cleanImg && cleanImg !== cleanHero) ? cleanImg : (cleanHero || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&fit=crop&auto=format');
}

