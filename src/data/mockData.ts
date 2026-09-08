import { Product, CategoryMeta, Coupon, HeroSlide, Order, Address, UserProfile } from '../types';

export const initialCategories: CategoryMeta[] = [];
export const initialProducts: Product[] = [];
export const initialCoupons: Coupon[] = [];
export const initialHeroSlides: HeroSlide[] = [
  {
    id: 'banner-kundan-heirloom',
    pretitle: 'Royal Heritage Collection',
    title: 'Handcrafted Kundan & Polki Heirlooms',
    subtitle: 'Exquisite 22-karat gold-plated masterpieces sculpted by generational royal karigars for celebratory grandeur.',
    ctaText: 'Explore Jewellery',
    ctaLink: '/category/apparel',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1920&q=80',
    active: true,
  },
  {
    id: 'banner-temple-bridal',
    pretitle: 'Bridal Solitaires & Temple Gold',
    title: 'Timeless Temple Jewellery & Chokers',
    subtitle: 'Adorn sacred auspicious moments with hand-faceted gemstones, uncut polki diamonds, and antique temple motifs.',
    ctaText: 'Shop Bridal Edit',
    ctaLink: '/category/apparel',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1920&q=80',
    active: true,
  },
  {
    id: 'banner-artisanal-living',
    pretitle: 'Artisanal Living & Gifting',
    title: 'Curated Brass Accents & Candlelight',
    subtitle: 'Transform living spaces with handcrafted heritage brassware, botanical soy candles, and bespoke artisanal gifts.',
    ctaText: 'Discover Home & Lifestyle',
    ctaLink: '/category/Lifestyle',
    image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1920&q=80',
    active: true,
  },
];

export const initialUser: UserProfile = {
  name: '',
  email: '',
  phone: '',
};

export const initialAddresses: Address[] = [];
export const initialOrders: Order[] = [];
