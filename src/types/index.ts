export type MainCategorySlug = string;

export type ProductBadge = 'Best Seller' | 'New' | 'Trending' | 'Premium' | 'Organic' | 'Custom' | 'Festive' | 'Corporate' | 'Sale';

export type ProductStatus = 'Active' | 'Out of Stock' | 'Draft' | 'Inactive';

export interface ProductVariant {
  name: string; // e.g. "Size", "Fragrance", "Pack Size"
  options: string[]; // e.g. ["16 inch", "18 inch"], ["Lavender", "Citrus"]
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string; // e.g. "Jewellery & Accessories"
  categorySlug: MainCategorySlug;
  subcategory: string; // e.g. "Necklace", "Sand Wax Candle"
  badge?: ProductBadge;
  lifestyleTag?: string;
  image: string;
  images?: string[];
  description?: string;
  specifications?: Record<string, string>;
  careInstructions?: string[];
  stock: number;
  status: ProductStatus;
  rating?: number;
  reviewsCount?: number;
  variants?: ProductVariant[];
  featured?: boolean;
  createdAt?: string;
}

export interface CategoryMeta {
  id: string;
  slug: MainCategorySlug;
  title: string;
  subtitle: string;
  heroImage: string;
  bannerImage: string;
  subcategories: string[];
  subcatImages: { name: string; image: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: Record<string, string>;
}

export interface Address {
  id: string;
  label: 'Home' | 'Office' | 'Other';
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export type OrderStatus = 'New' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  variant?: string;
}

export interface Order {
  id: string; // e.g. "PUR-2026-8492"
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  total: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: Address;
  paymentMethod: 'UPI' | 'Credit / Debit Card' | 'Net Banking' | 'Razorpay' | 'Cash on Delivery';
  trackingNumber?: string;
  courierPartner?: string;
  estimatedDelivery?: string;
  trackingHistory?: {
    status: string;
    time: string;
    location: string;
    completed: boolean;
  }[];
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  isActive: boolean;
  description: string;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom?: string;
  validUntil?: string;
  expiryDate?: string;
  usageCount?: number;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  pretitle?: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  active: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

export interface HomeMiddleSection {
  id: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  features: string[];
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  isActive: boolean;
}

export interface HomeBottomCard {
  iconText: string;
  title: string;
  description: string;
  image?: string;
}

export interface HomeBottomSection {
  id: string;
  tag: string;
  heading: string;
  subheading: string;
  cards: HomeBottomCard[];
  isActive: boolean;
}
