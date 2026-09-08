import { Product, CategoryMeta, Coupon, HeroSlide, Order, Address, UserProfile } from '../types';

export const initialCategories: CategoryMeta[] = [];
export const initialProducts: Product[] = [];
export const initialCoupons: Coupon[] = [];
export const initialHeroSlides: HeroSlide[] = [];

export const initialUser: UserProfile = {
  name: '',
  email: '',
  phone: '',
};

export const initialAddresses: Address[] = [];
export const initialOrders: Order[] = [];
