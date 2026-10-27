'use client';

import { usePathname } from 'next/navigation';
import { PREPAID_ANNOUNCEMENT, prepaidAnnouncement } from '../lib/paymentPolicy';
import { getStorefrontBanners } from '../lib/storefrontBanners';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Product,
  CategoryMeta,
  CartItem,
  Order,
  OrderStatus,
  Coupon,
  HeroSlide,
  Address,
  UserProfile,
} from '../types';
import {
  initialCategories,
  initialProducts,
  initialCoupons,
  initialHeroSlides,
  initialOrders,
  initialAddresses,
  initialUser,
  getSubcategoryImage,
} from '../data/mockData';
import {
  checkSupabaseConnection,
  isSupabaseConfigured,
  getProductsFromSupabase,
  getCategoriesFromSupabase,
  updateOrderInSupabase,
  seedCatalogToSupabase,
  upsertProductToSupabase,
  deleteProductFromSupabase,
  getBannersFromSupabase,
  upsertBannerToSupabase,
  deleteBannerFromSupabase,
  getBannerPrioritiesFromSupabase,
  saveBannerPrioritiesToSupabase,
  getAnnouncementFromSupabase,
  saveAnnouncementToSupabase,
  getAddressesFromSupabase,
  saveAddressToSupabase,
  updateAddressInSupabase,
  deleteAddressFromSupabase,
  getAllOrdersFromSupabase,
  getCouponsFromSupabase,
  saveCouponToSupabase,
  toggleCouponInSupabase,
  deleteCouponFromSupabase,
  signOutFromSupabase,
  checkIsAdmin,
  supabase,
} from '../lib/supabase';
import { isAdminEmail, readAdminSession } from '../lib/adminPermissions';
import { getCouponDiscount, getCouponProblem, getOrderTotal, getShippingFee } from '../lib/pricing';


interface ToastState {
  id: string;
  title: string;
  desc?: string;
  type?: 'success' | 'info' | 'error';
}

export interface AuthModalState {
  isOpen: boolean;
  actionType?: 'order' | 'wishlist' | 'bag' | 'review';
  title?: string;
  message?: string;
  redirectUrl?: string;
  mode?: 'login' | 'signup' | 'forgot';
}

interface StoreContextType {
  products: Product[];
  categories: CategoryMeta[];
  cart: CartItem[];
  wishlist: Product[];
  orders: Order[];
  refreshOrders: () => Promise<void>;
  coupons: Coupon[];
  banners: HeroSlide[];
  heroBanners: HeroSlide[];
  markHeroReady: () => void;
  bannersLoaded: boolean;
  bannersError: boolean;
  retryBanners: () => void;
  announcement: string;
  user: UserProfile;
  isAuthLoading: boolean;
  mounted: boolean;
  addresses: Address[];
  appliedCoupon: Coupon | null;
  toast: ToastState | null;
  authModal: AuthModalState | null;
  openAuthModal: (options?: {
    actionType?: 'order' | 'wishlist' | 'bag' | 'review';
    title?: string;
    message?: string;
    redirectUrl?: string;
    mode?: 'login' | 'signup' | 'forgot';
  }) => void;
  closeAuthModal: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Supabase Cloud Integration
  supabaseStatus: {
    connected: boolean;
    message: string;
    projectRef: string;
    tablesFound?: string[];
  };
  syncCatalogToSupabase: () => Promise<{ success: boolean; message: string }>;

  // Storefront Actions
  showToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
  addToCart: (product: Product, quantity?: number, variant?: Record<string, string>) => void;
  updateCartQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  syncCartPrices: (unitPrices: Record<string, number>) => void;
  recordPlacedOrder: (order: Order) => void;

  // Calculations
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartTotal: number;
  cartCount: number;
  wishlistCount: number;

  addProduct: (newProd: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string, courierPartner?: string) => void;
  addCategorySubcategory: (categorySlug: string, subcategoryName: string, image?: string) => void;
  updateCategorySubcategory: (categorySlug: string, oldName: string, newName: string, newImage?: string) => void;
  removeCategorySubcategory: (categorySlug: string, subcategoryName: string) => void;
  updateCategory: (categorySlug: string, updates: Partial<CategoryMeta>) => void;
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (code: string, updates: Partial<Coupon>) => void;
  toggleCoupon: (code: string) => void;
  deleteCoupon: (code: string) => void;
  addHeroSlide: (slide: HeroSlide) => void;
  updateHeroSlide: (slide: HeroSlide) => void;
  deleteHeroSlide: (id: string) => void;
  reorderBanners: (slides: HeroSlide[]) => void;
  updateBannerPriority: (id: string, priority: number) => Promise<void>;
  saveAllBannerPriorities: (bannersToSave?: HeroSlide[]) => Promise<{ success: boolean; message: string }>;
  updateAnnouncement: (text: string) => void;
  updateUser: (profile: Partial<UserProfile>) => void;
  loginUser: (profile: UserProfile) => void;
  logoutUser: () => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  refreshCatalog: () => Promise<void>;
}

export function sortBannersByFiveWorlds(slides: HeroSlide[]): HeroSlide[] {
  const getWeight = (slide: HeroSlide) => {
    const s = `${slide.ctaLink || ''} ${slide.title || ''} ${slide.pretitle || ''} ${slide.subtitle || ''}`.toLowerCase();
    if (s.includes('jewel') || s.includes('apparel') || s.includes('accessor')) return 1;
    if (s.includes('candle') || s.includes('fragrance')) return 2;
    if (s.includes('decor') || s.includes('décor') || s.includes('lifestyle')) return 3;
    if (s.includes('wellness') || s.includes('organic')) return 4;
    if (s.includes('gift') || s.includes('stationery')) return 5;
    return slide.priority ?? 99;
  };

  return [...slides].sort((a, b) => getWeight(a) - getWeight(b));
}

export function orderBanners(slides: HeroSlide[]): HeroSlide[] {
  if (!slides || slides.length === 0) return [];
  const hasPriorities = slides.some((s) => typeof s.priority === 'number');
  if (hasPriorities) {
    const sorted = [...slides].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    return sorted.map((s, idx) => ({ ...s, priority: idx + 1 }));
  }
  return sortBannersByFiveWorlds(slides).map((s, idx) => ({ ...s, priority: idx + 1 }));
}


function enrichCategories(cats: CategoryMeta[]): CategoryMeta[] {
  if (!cats || cats.length === 0) return initialCategories;
  return cats.map((cat) => {
    const initCat = initialCategories.find(
      (ic) => ic.id === cat.id || (ic.slug || '').toLowerCase() === (cat.slug || '').toLowerCase()
    );
    const hero = cat.heroImage || cat.bannerImage || initCat?.heroImage || '';
    const banner = cat.bannerImage || cat.heroImage || initCat?.bannerImage || '';
    const subcatNames = (cat.subcategories && cat.subcategories.length > 0)
      ? cat.subcategories
      : (initCat?.subcategories || ['All']);
    
    const rawSubImgs = (cat.subcatImages && cat.subcatImages.length > 0)
      ? cat.subcatImages
      : (initCat?.subcatImages || []);

    const enrichedSubImgs = subcatNames
      .filter((s) => s !== 'All')
      .map((sName) => {
        const found = rawSubImgs.find((item) => item.name.trim().toLowerCase() === sName.trim().toLowerCase());
        return {
          name: sName,
          image: getSubcategoryImage(sName, hero, found?.image),
        };
      });

    return {
      ...cat,
      heroImage: hero,
      bannerImage: banner,
      subcategories: subcatNames,
      subcatImages: enrichedSubImgs,
    };
  });
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Client-side initialization flag
  const [mounted, setMounted] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryMeta[]>(() => enrichCategories(initialCategories));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Orders come only from the database. Row-level security decides what this
  // visitor may see: admins every order, customers their own, guests none.
  const loadOrders = useCallback(async () => {
    const dbOrders = await getAllOrdersFromSupabase();
    setOrders(dbOrders);
  }, []);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [banners, setBanners] = useState<HeroSlide[]>(() => isSupabaseConfigured ? [] : orderBanners(initialHeroSlides));
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [fadeOutLoading, setFadeOutLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOutLoading(true);
      setTimeout(() => {
        setIsGlobalLoading(false);
      }, 500);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  const [heroBanners, setHeroBanners] = useState<HeroSlide[]>(() => isSupabaseConfigured ? [] : orderBanners(initialHeroSlides));
  const [heroReady, setHeroReady] = useState(false);
  const markHeroReady = useCallback(() => setHeroReady(true), []);
  const [bannersLoaded, setBannersLoaded] = useState(!isSupabaseConfigured);
  const [bannersError, setBannersError] = useState(false);
  const bannerRequest = useRef(0);
  const retryBanners = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const request = ++bannerRequest.current;
    setBannersError(false);
    setBannersLoaded(false);
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, attempt * 800));
      if (request !== bannerRequest.current) return;
      const latest = await (isAdminPage ? getBannersFromSupabase() : getStorefrontBanners());
      if (request !== bannerRequest.current) return;
      // null means a failed request; [] means a successful empty collection.
      if (latest !== null) {
        if (isAdminPage) setBanners(orderBanners(latest));
        else setHeroBanners(orderBanners(latest));
        setBannersLoaded(true);
        return;
      }
    }
    setBannersError(true);
    setBannersLoaded(true);
  }, [isAdminPage]);

  useEffect(() => {
    void retryBanners();
    const retryOnConnection = () => { void retryBanners(); };
    window.addEventListener('online', retryOnConnection);
    return () => {
      bannerRequest.current++;
      window.removeEventListener('online', retryOnConnection);
    };
  }, [retryBanners]);
  const [announcement, setAnnouncementState] = useState<string>(PREPAID_ANNOUNCEMENT);
  const setAnnouncement = (text: string | null) => setAnnouncementState(prepaidAnnouncement(text));
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [authModal, setAuthModal] = useState<AuthModalState | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const openAuthModal = (options?: {
    actionType?: 'order' | 'wishlist' | 'bag' | 'review';
    title?: string;
    message?: string;
    redirectUrl?: string;
    mode?: 'login' | 'signup' | 'forgot';
  }) => {
    setAuthModal({
      isOpen: true,
      actionType: options?.actionType || 'order',
      title: options?.title,
      message: options?.message,
      redirectUrl: options?.redirectUrl || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      mode: options?.mode || 'login',
    });
  };

  const closeAuthModal = () => {
    setAuthModal(null);
  };

  // Supabase Cloud Status & Initialization
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    message: string;
    projectRef: string;
    tablesFound?: string[];
  }>({
    connected: false,
    message: 'Testing connection to Supabase cloud...',
    projectRef: '',
  });

  useEffect(() => {
    // Fetch real categories directly from Supabase immediately on mount
    getCategoriesFromSupabase().then((cats) => {
      if (cats && cats.length > 0) {
        const enriched = enrichCategories(cats);
        setCategories(enriched);
        try {
          localStorage.setItem('purnya_categories', JSON.stringify(enriched));
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }
      }
    });

    // Fetch real products with real uploaded images directly from Supabase immediately on mount
    getProductsFromSupabase().then((prods) => {
      if (prods && prods.length > 0) {
        setProducts(prods);
        try {
          localStorage.setItem('purnya_products', JSON.stringify(prods));
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }
      }
    });

    loadOrders();

    checkSupabaseConnection().then((status) => {
      setSupabaseStatus(status);
      if (status.connected) {
        getCategoriesFromSupabase().then((cats) => {
          if (cats && cats.length > 0) {
            const enriched = enrichCategories(cats);
            setCategories(enriched);
            try {
              localStorage.setItem('purnya_categories', JSON.stringify(enriched));
            } catch (e) {
              console.warn('LocalStorage save error:', e);
            }
          }
        });

        if (status.tablesFound?.includes('products')) {
          getProductsFromSupabase().then((prods) => {
            if (prods && prods.length > 0) {
              setProducts(prods);
              try {
                localStorage.setItem('purnya_products', JSON.stringify(prods));
              } catch { }
            }
          });
        }

        if (status.tablesFound?.includes('banners')) {
          getAnnouncementFromSupabase().then((dbAnnouncement) => {
            if (dbAnnouncement && dbAnnouncement.trim()) {
              setAnnouncement(dbAnnouncement);
              try {
                localStorage.setItem('purnya_announcement', dbAnnouncement);
              } catch { }
            } else {
              // Seed default announcement into Supabase
              saveAnnouncementToSupabase(PREPAID_ANNOUNCEMENT);
            }
          });


        }
      }
    });

    // Real-time Supabase Auth state listener & sync
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const u = session.user;
          const currentEmail = (u.email || '').trim().toLowerCase();

          // Check if this Supabase authenticated user is an administrator
          const isUserAdmin = isAdminEmail(currentEmail) || await checkIsAdmin(currentEmail);
          if (isUserAdmin) {
            // Admin user is authenticated for the admin portal: DO NOT show on customer storefront!
            try {
              const savedUser = localStorage.getItem('purnya_user');
              if (savedUser) {
                const parsed = JSON.parse(savedUser);
                if (parsed?.email?.trim().toLowerCase() === currentEmail || isAdminEmail(parsed?.email)) {
                  localStorage.removeItem('purnya_user');
                }
              }
            } catch { }
            loadOrders();
            setIsAuthLoading(false);
            return;
          }

          const meta = u.user_metadata || {};
          const currentName = meta.name || meta.full_name || currentEmail.split('@')[0] || 'Patron';
          const currentPhone = meta.phone || '';
          const activeUser: UserProfile = {
            id: u.id,
            name: currentName,
            email: currentEmail,
            phone: currentPhone,
          };
          setUser(activeUser);
          try {
            localStorage.setItem('purnya_user', JSON.stringify(activeUser));
          } catch { }

          // Fetch cloud addresses
          getAddressesFromSupabase(currentEmail).then((cloudAddrs) => {
            if (cloudAddrs && cloudAddrs.length > 0) {
              setAddresses(cloudAddrs);
              try {
                localStorage.setItem('purnya_addresses', JSON.stringify(cloudAddrs));
              } catch { }
            }
          });

          loadOrders();
        }
        setIsAuthLoading(false);
      }).catch(() => {
        setIsAuthLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          const u = session.user;
          const currentEmail = (u.email || '').trim().toLowerCase();

          // Check if this Supabase authenticated user is an administrator
          const isUserAdmin = isAdminEmail(currentEmail) || await checkIsAdmin(currentEmail);
          if (isUserAdmin) {
            // Admin user signed in: Ensure customer storefront state remains clean
            try {
              const savedUser = localStorage.getItem('purnya_user');
              if (savedUser) {
                const parsed = JSON.parse(savedUser);
                if (parsed?.email?.trim().toLowerCase() === currentEmail || isAdminEmail(parsed?.email)) {
                  localStorage.removeItem('purnya_user');
                }
              }
            } catch { }
            loadOrders();
            setIsAuthLoading(false);
            return;
          }

          const meta = u.user_metadata || {};
          const currentName = meta.name || meta.full_name || currentEmail.split('@')[0] || 'Patron';
          const currentPhone = meta.phone || '';
          const activeUser: UserProfile = {
            id: u.id,
            name: currentName,
            email: currentEmail,
            phone: currentPhone,
          };
          setUser(activeUser);
          try {
            localStorage.setItem('purnya_user', JSON.stringify(activeUser));
          } catch { }
          setIsAuthLoading(false);

          const cloudAddrs = await getAddressesFromSupabase(currentEmail);
          if (cloudAddrs && cloudAddrs.length > 0) {
            setAddresses(cloudAddrs);
            try {
              localStorage.setItem('purnya_addresses', JSON.stringify(cloudAddrs));
            } catch { }
          }

          loadOrders();
        } else if (event === 'SIGNED_OUT') {
          // If customer signed out (and not an active admin session), clear storefront patron
          if (!readAdminSession()) {
            setUser({ id: undefined, name: '', email: '', phone: '' });
            setOrders([]);
            try {
              localStorage.removeItem('purnya_user');
              localStorage.removeItem('purnya_addresses');
            } catch { }
          }
          setIsAuthLoading(false);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  const refreshCatalog = useCallback(async () => {
    try {
      const [prods, cats, dbBanners, dbAnnouncement, dbCoupons] = await Promise.all([
        getProductsFromSupabase(),
        getCategoriesFromSupabase(),
        isAdminPage ? getBannersFromSupabase() : getStorefrontBanners(),
        getAnnouncementFromSupabase(),
        getCouponsFromSupabase(),
      ]);
      if (prods && prods.length > 0) {
        setProducts(prods);
        try {
          localStorage.setItem('purnya_products', JSON.stringify(prods));
        } catch { }
      }
      if (cats && cats.length > 0) {
        const enriched = enrichCategories(cats);
        setCategories(enriched);
        try {
          localStorage.setItem('purnya_categories', JSON.stringify(enriched));
        } catch { }
      }
      if (dbBanners && dbBanners.length > 0) {
        const ordered = orderBanners(dbBanners);
        if (isAdminPage) setBanners(ordered);
        else setHeroBanners(ordered);
        try {
          if (isAdminPage) localStorage.setItem('purnya_banners', JSON.stringify(ordered));
        } catch { }
      }
      if (dbAnnouncement && dbAnnouncement.trim()) {
        setAnnouncement(dbAnnouncement);
        try {
          localStorage.setItem('purnya_announcement', dbAnnouncement);
        } catch { }
      }
      if (dbCoupons && dbCoupons.length > 0) {
        setCoupons(dbCoupons);
        try {
          localStorage.setItem('purnya_coupons', JSON.stringify(dbCoupons));
        } catch { }
      }
    } catch (e) {
      console.warn('Refresh catalog error:', e);
    }
  }, [isAdminPage]);

  // Listen for catalog updates from admin actions
  useEffect(() => {
    const handleCatalogUpdated = () => {
      refreshCatalog();
    };
    window.addEventListener('purnya_catalog_updated', handleCatalogUpdated);
    return () => window.removeEventListener('purnya_catalog_updated', handleCatalogUpdated);
  }, [refreshCatalog]);

  // Load from localStorage on mount safely and synchronously on client
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('purnya_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const savedEmail = parsedUser?.email?.trim().toLowerCase();
          if (savedEmail && (isAdminEmail(savedEmail) || savedEmail === 'admin@purnya.com')) {
            localStorage.removeItem('purnya_user');
          } else if (parsedUser && (parsedUser.email || parsedUser.name)) {
            setUser(parsedUser);
          }
        } catch { }
      }

      const savedCart = localStorage.getItem('purnya_cart');
      if (savedCart) {
        try { setCart(JSON.parse(savedCart)); } catch { }
      }

      const savedWishlist = localStorage.getItem('purnya_wishlist');
      if (savedWishlist) {
        try { setWishlist(JSON.parse(savedWishlist)); } catch { }
      }

      // Orders are no longer cached in the browser; drop any old copy.
      localStorage.removeItem('purnya_orders');

      const savedAddresses = localStorage.getItem('purnya_addresses');
      if (savedAddresses) {
        try { setAddresses(JSON.parse(savedAddresses)); } catch { }
      }

      const savedProducts = localStorage.getItem('purnya_products');
      if (savedProducts) {
        try {
          const parsedProds: Product[] = JSON.parse(savedProducts);
          if (Array.isArray(parsedProds) && parsedProds.length > 0) {
            const cleanProds = parsedProds.filter(p => !p.id.startsWith('prod-'));
            setProducts(cleanProds);
          }
        } catch { }
      }

      const savedCategories = localStorage.getItem('purnya_categories');
      if (savedCategories) {
        try {
          const parsed = JSON.parse(savedCategories);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategories(enrichCategories(parsed));
          }
        } catch { }
      }

      const savedCoupons = localStorage.getItem('purnya_coupons');
      if (savedCoupons) {
        try { setCoupons(JSON.parse(savedCoupons)); } catch { }
      }

      const savedBanners = localStorage.getItem('purnya_banners');
      // Cached uploads omit image data; never display them before cloud banners arrive.
      if (savedBanners && !isSupabaseConfigured) {
        try {
          const parsed = JSON.parse(savedBanners);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBanners(orderBanners(parsed));
          }
        } catch { }
      }

      const savedAnnouncement = localStorage.getItem('purnya_announcement');
      if (savedAnnouncement) setAnnouncement(savedAnnouncement);
    } catch (e) {
      console.warn('LocalStorage load error', e);
    } finally {
      setMounted(true);
      setIsAuthLoading(false);
    }
  }, []);

  // Real-time synchronization across multiple open browser tabs/windows
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'purnya_cart') setCart(JSON.parse(e.newValue));
        if (e.key === 'purnya_wishlist') setWishlist(JSON.parse(e.newValue));
        if (e.key === 'purnya_user') setUser(JSON.parse(e.newValue));
        if (e.key === 'purnya_addresses') setAddresses(JSON.parse(e.newValue));
        if (e.key === 'purnya_products') setProducts(JSON.parse(e.newValue));
        if (e.key === 'purnya_categories') setCategories(JSON.parse(e.newValue));
        if (e.key === 'purnya_banners') {
          // Re-fetch the actual images, rather than the image-stripped storage copy.
          if (isSupabaseConfigured) {
            void retryBanners();
          } else {
            setBanners(orderBanners(JSON.parse(e.newValue)));
          }
        }
        if (e.key === 'purnya_announcement') setAnnouncement(e.newValue);
      } catch (err) {
        console.warn('Cross-tab storage sync error', err);
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [retryBanners]);

  // Safe localStorage saver that catches QuotaExceededErrors and strips base64 data URLs
  const safeSaveToLocalStorage = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    try {
      let toStore = data;
      if (typeof data !== 'string') {
        if (Array.isArray(data)) {
          toStore = data.map((item: any) => {
            if (!item || typeof item !== 'object') return item;
            const copy = { ...item };
            if (typeof copy.image === 'string' && copy.image.startsWith('data:')) {
              copy.image = '';
            }
            if (Array.isArray(copy.images)) {
              copy.images = copy.images.filter((img: any) => typeof img === 'string' && !img.startsWith('data:'));
            }
            return copy;
          });
        }
        toStore = JSON.stringify(toStore);
      }
      localStorage.setItem(key, toStore);
    } catch {
      // Silently catch quota exceeded errors
    }
  };

  // Save to localStorage when state changes
  useEffect(() => {
    if (!mounted) return;
    safeSaveToLocalStorage('purnya_products', products);
    safeSaveToLocalStorage('purnya_categories', categories);
    safeSaveToLocalStorage('purnya_cart', cart);
    safeSaveToLocalStorage('purnya_wishlist', wishlist);
    safeSaveToLocalStorage('purnya_coupons', coupons);
    if (isAdminPage && bannersLoaded && !bannersError) safeSaveToLocalStorage('purnya_banners', banners);
    safeSaveToLocalStorage('purnya_announcement', announcement);
    safeSaveToLocalStorage('purnya_addresses', addresses);
    safeSaveToLocalStorage('purnya_user', user);
  }, [mounted, isAdminPage, products, categories, cart, wishlist, orders, coupons, banners, bannersLoaded, bannersError, announcement, addresses, user]);

  // Toast helper
  const showToast = (title: string, desc?: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, title, desc, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3200);
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, variant?: Record<string, string>) => {
    if (!user?.email) {
      showToast('Sign In Required 🛍️', 'Please sign in to add pieces to your bag.', 'info');
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (variant) updated[existingIndex].selectedVariant = variant;
        return updated;
      }
      return [...prev, { product, quantity, selectedVariant: variant }];
    });
    showToast('Added to Bag 🛍️', `${product.name} (Qty: ${quantity})`);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Removed from Cart', undefined, 'info');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Wishlist operations
  const toggleWishlist = (product: Product) => {
    if (!user?.email) {
      showToast('Sign In Required ✨', 'Please sign in to save pieces to your wishlist.', 'info');
      return;
    }

    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        showToast('Removed from Wishlist 💔', `"${product.name}" has been removed from your saved pieces.`, 'info');
        return prev.filter(item => item.id !== product.id);
      } else {
        showToast('Saved to Wishlist ✨', `"${product.name}" added to your cherished collection.`, 'success');
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  // Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    return getCouponDiscount(appliedCoupon, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const cartShipping = useMemo(() => {
    return getShippingFee(cartSubtotal, cart.length);
  }, [cart, cartSubtotal]);

  const cartTotal = useMemo(() => {
    return getOrderTotal(cartSubtotal, cartDiscount, cartShipping);
  }, [cartSubtotal, cartDiscount, cartShipping]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const wishlistCount = wishlist.length;

  // Coupon Engine
  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find(c => c.code === cleanCode && c.isActive);

    if (!found) {
      return { success: false, message: 'Invalid or inactive coupon code.' };
    }
    const problem = getCouponProblem(found, cartSubtotal);
    if (problem) {
      return { success: false, message: problem };
    }

    setAppliedCoupon(found);
    showToast('Coupon Applied!', `You unlocked ${found.code} savings.`);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon Removed', undefined, 'info');
  };

  // Bring bag prices in line with what the server will charge (see create-order).
  const syncCartPrices = (unitPrices: Record<string, number>) => {
    setCart(prev =>
      prev.map(item => {
        const price = unitPrices[item.product.id];
        return price === undefined || price === item.product.price
          ? item
          : { ...item, product: { ...item.product, price } };
      })
    );
  };

  // The server creates the order once payment is confirmed (lib/orderServer.ts);
  // here we only show it and empty the bag.
  const recordPlacedOrder = (order: Order) => {
    setOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
    clearCart();
    showToast('Order Placed!', `Your Order #${order.id} has been confirmed.`, 'success');
  };

  // Admin Product Actions
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const id = `p-${Date.now()}`;
    const productWithId: Product = { ...newProd, id, createdAt: new Date().toISOString() };
    setProducts(prev => [productWithId, ...prev]);
    showToast('Product Created', `${productWithId.name} added to catalog.`);
    upsertProductToSupabase(productWithId).catch(err =>
      console.warn('Supabase product sync error:', err)
    );
    return productWithId;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      const target = updated.find(p => p.id === id);
      if (target) {
        upsertProductToSupabase(target).catch(err =>
          console.warn('Supabase product update sync error:', err)
        );
      }
      return updated;
    });
    showToast('Product Updated', 'Changes saved successfully.');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    deleteProductFromSupabase(id).catch(err =>
      console.warn('Supabase product delete sync error:', err)
    );
    showToast('Product Deleted', undefined, 'info');
  };

  // Admin Order Actions
  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string,
    courierPartner?: string
  ) => {
    setOrders(prev => {
      let updatedOrder: Order | null = null;
      const newOrders = prev.map(ord => {
        if (ord.id === orderId) {
          const updatedHistory = ord.trackingHistory ? [...ord.trackingHistory] : [];
          // Update matching status in history if exists
          const historyIndex = updatedHistory.findIndex(h => h.status.toLowerCase().includes(status.toLowerCase()));
          if (historyIndex >= 0) {
            updatedHistory[historyIndex].completed = true;
            updatedHistory[historyIndex].time = 'Just Now';
          } else {
            updatedHistory.push({
              status: `Status changed to ${status}`,
              time: 'Just Now',
              location: 'Purnya Logistics Desk',
              completed: true,
            });
          }

          updatedOrder = {
            ...ord,
            status,
            trackingNumber: trackingNumber || ord.trackingNumber,
            courierPartner: courierPartner || ord.courierPartner,
            trackingHistory: updatedHistory,
          };
          return updatedOrder;
        }
        return ord;
      });

      if (updatedOrder) {
        updateOrderInSupabase(orderId, {
          status: (updatedOrder as Order).status,
          tracking_number: (updatedOrder as Order).trackingNumber,
          courier: (updatedOrder as Order).courierPartner
        }).catch(err => console.warn('Supabase update order sync:', err));
      }

      return newOrders;
    });
    showToast('Order Updated', `Order ${orderId} is now ${status}.`);
  };

  // Admin Category Actions
  const addCategorySubcategory = (categorySlug: string, subcategoryName: string, image?: string) => {
    const fallbackImg = image || 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=200&fit=crop&auto=format';
    setCategories(prev =>
      prev.map(cat => {
        if (cat.slug === categorySlug) {
          if (!cat.subcategories.includes(subcategoryName)) {
            return {
              ...cat,
              subcategories: [...cat.subcategories, subcategoryName],
              subcatImages: [
                ...(cat.subcatImages || []),
                {
                  name: subcategoryName,
                  image: fallbackImg,
                },
              ],
            };
          }
        }
        return cat;
      })
    );
    showToast('Subcategory Added', `${subcategoryName} added to ${categorySlug}.`);
  };

  const updateCategorySubcategory = (
    categorySlug: string,
    oldName: string,
    newName: string,
    newImage?: string
  ) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.slug === categorySlug) {
          const updatedSubs = cat.subcategories.map(s => (s === oldName ? newName : s));
          const updatedImages = (cat.subcatImages || []).map(item => {
            if (item.name === oldName) {
              return {
                name: newName,
                image: newImage || item.image,
              };
            }
            return item;
          });
          return {
            ...cat,
            subcategories: updatedSubs,
            subcatImages: updatedImages,
          };
        }
        return cat;
      })
    );
    showToast('Subcategory Updated', `${newName} configuration saved.`);
  };

  const removeCategorySubcategory = (categorySlug: string, subcategoryName: string) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.slug === categorySlug) {
          return {
            ...cat,
            subcategories: cat.subcategories.filter(s => s !== subcategoryName),
            subcatImages: (cat.subcatImages || []).filter(item => item.name !== subcategoryName),
          };
        }
        return cat;
      })
    );
    showToast('Subcategory Removed', `${subcategoryName} deleted from ${categorySlug}.`);
  };

  const updateCategory = (categorySlug: string, updates: Partial<CategoryMeta>) => {
    setCategories(prev =>
      prev.map(cat => (cat.slug === categorySlug ? { ...cat, ...updates } : cat))
    );
    showToast('Category Updated', 'Category details and imagery updated.');
  };

  // Admin Coupons
  const addCoupon = (coupon: Coupon) => {
    setCoupons(prev => [coupon, ...prev.filter(c => c.code !== coupon.code)]);
    showToast('Coupon Created', `Coupon code ${coupon.code} is active.`);
    saveCouponToSupabase(coupon).catch(err => {
      console.warn('Supabase coupon save error:', err);
    });
  };

  const updateCoupon = (code: string, updates: Partial<Coupon>) => {
    setCoupons(prev =>
      prev.map(c => {
        if (c.code === code) {
          const updated = { ...c, ...updates };
          saveCouponToSupabase(updated).catch(err => {
            console.warn('Supabase coupon update error:', err);
          });
          return updated;
        }
        return c;
      })
    );
    showToast('Coupon Updated', `Coupon code ${code} updated.`);
  };

  const toggleCoupon = (code: string) => {
    setCoupons(prev =>
      prev.map(c => {
        if (c.code === code) {
          const nextActive = !c.isActive;
          toggleCouponInSupabase(code, nextActive).catch(err => {
            console.warn('Supabase coupon toggle error:', err);
          });
          return { ...c, isActive: nextActive };
        }
        return c;
      })
    );
  };

  const deleteCoupon = (code: string) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
    showToast('Coupon Deleted', `Coupon code ${code} removed.`);
    deleteCouponFromSupabase(code).catch(err => {
      console.warn('Supabase coupon delete error:', err);
    });
  };

  // Admin Banners
  const addHeroSlide = (slide: HeroSlide) => {
    const withPriority = {
      ...slide,
      priority: slide.priority ?? (banners.length + 1),
    };
    const updated = [...banners, withPriority].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    setBanners(updated);
    safeSaveToLocalStorage('purnya_banners', updated);
    showToast('Banner Added', 'New homepage hero banner created.');
    upsertBannerToSupabase(withPriority).catch((err) => {
      console.warn('Supabase banner save error:', err);
    });
  };

  const updateHeroSlide = (slide: HeroSlide) => {
    const currentIndex = banners.findIndex((b) => b.id === slide.id);
    if (currentIndex === -1) return;

    const targetIndex = typeof slide.priority === 'number'
      ? Math.max(0, Math.min(slide.priority - 1, banners.length - 1))
      : currentIndex;

    const updated = [...banners];
    updated[currentIndex] = slide;

    if (targetIndex !== currentIndex) {
      const [movedItem] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
    }

    const reindexed = updated.map((s, idx) => ({
      ...s,
      priority: idx + 1,
    }));

    setBanners(reindexed);
    safeSaveToLocalStorage('purnya_banners', reindexed);
    safeSaveToLocalStorage('purnya_banners_order', reindexed.map((s) => s.id));

    const prioritiesMap: Record<string, number> = {};
    reindexed.forEach((s) => {
      prioritiesMap[s.id] = s.priority!;
    });
    saveBannerPrioritiesToSupabase(prioritiesMap).catch(() => {});

    reindexed.forEach((s) => {
      supabase
        ?.from('banners')
        .update({ priority: s.priority })
        .eq('id', s.id)
        .then(() => {}, () => {});
    });

    upsertBannerToSupabase(slide).catch((err) => {
      console.warn('Supabase banner update error:', err);
    });

    showToast('Banner Updated ✨', `Slide updated at Priority #${targetIndex + 1}.`);
  };

  const deleteHeroSlide = (id: string) => {
    setBanners((prev) => prev.filter((s) => s.id !== id));
    showToast('Banner Deleted', 'Homepage hero slide removed.');
    deleteBannerFromSupabase(id).catch((err) => {
      console.warn('Supabase banner delete error:', err);
    });
  };

  const reorderBanners = (newSlides: HeroSlide[]) => {
    const withPriorities = newSlides.map((s, idx) => ({
      ...s,
      priority: idx + 1,
    }));
    setBanners(withPriorities);
    safeSaveToLocalStorage('purnya_banners', withPriorities);
    safeSaveToLocalStorage('purnya_banners_order', withPriorities.map((s) => s.id));

    const prioritiesMap: Record<string, number> = {};
    withPriorities.forEach((s) => {
      prioritiesMap[s.id] = s.priority!;
    });
    saveBannerPrioritiesToSupabase(prioritiesMap).catch((err) => {
      console.warn('Supabase banner priorities save error:', err);
    });

    withPriorities.forEach((s) => {
      supabase
        ?.from('banners')
        .update({ priority: s.priority })
        .eq('id', s.id)
        .then(() => {}, () => {});
    });

    showToast('Banner Order & Priorities Saved ✨', 'Synced and saved to database.');
  };

  const updateBannerPriority = async (id: string, targetPriority: number) => {
    const currentIndex = banners.findIndex((b) => b.id === id);
    if (currentIndex === -1) return;

    // Target position (0-indexed) clamped between 0 and banners.length - 1
    const targetIndex = Math.max(0, Math.min(targetPriority - 1, banners.length - 1));

    // Splice item out and insert at new target position
    const updated = [...banners];
    const [movedItem] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    // Re-assign strict sequential 1..N priorities so NO TWO banners can ever have the same priority
    const reindexed = updated.map((slide, idx) => ({
      ...slide,
      priority: idx + 1,
    }));

    setBanners(reindexed);
    safeSaveToLocalStorage('purnya_banners', reindexed);
    safeSaveToLocalStorage('purnya_banners_order', reindexed.map((s) => s.id));

    const prioritiesMap: Record<string, number> = {};
    reindexed.forEach((s) => {
      prioritiesMap[s.id] = s.priority!;
    });

    await saveBannerPrioritiesToSupabase(prioritiesMap);

    reindexed.forEach((s) => {
      supabase
        ?.from('banners')
        .update({ priority: s.priority })
        .eq('id', s.id)
        .then(() => {}, () => {});
    });

    showToast('Priority Updated ✨', `Banner set to Priority #${targetPriority}. Cleanly shifted 1 to ${reindexed.length}.`);
  };

  const saveAllBannerPriorities = async (bannersToSave?: HeroSlide[]) => {
    const target = bannersToSave || banners;
    const prioritiesMap: Record<string, number> = {};
    target.forEach((b, idx) => {
      prioritiesMap[b.id] = b.priority ?? idx + 1;
    });
    const res = await saveBannerPrioritiesToSupabase(prioritiesMap);
    if (res.success) {
      showToast('Priorities Saved ✨', 'All banner priorities successfully connected and saved in database.');
      return { success: true, message: 'Priorities saved to database.' };
    } else {
      showToast('Save Error', res.error || 'Failed to save to database', 'error');
      return { success: false, message: res.error || 'Failed to save' };
    }
  };

  const updateAnnouncement = (text: string) => {
    setAnnouncement(text);
    showToast('Announcement Updated', 'Store announcement bar refreshed and saved to database.');
    saveAnnouncementToSupabase(text).catch((err) => {
      console.warn('Supabase announcement save error:', err);
    });
  };

  // User & Addresses
  const updateUser = (profile: Partial<UserProfile>) => {
    setUser(prev => {
      const merged = { ...prev, ...profile };
      try {
        localStorage.setItem('purnya_user', JSON.stringify(merged));
      } catch { }
      return merged;
    });
    showToast('Profile Updated', 'Personal information saved.');
  };

  const loginUser = (profile: UserProfile) => {
    if (profile.email && isAdminEmail(profile.email)) {
      showToast('Admin Account Detected', 'Please sign in via the Admin Portal to access administrative functions.', 'info');
      return;
    }
    setUser(profile);
    try {
      localStorage.setItem('purnya_user', JSON.stringify(profile));
    } catch { }

    if (profile.email) {
      getAddressesFromSupabase(profile.email).then((cloudAddrs) => {
        if (cloudAddrs && cloudAddrs.length > 0) {
          setAddresses(cloudAddrs);
          try {
            localStorage.setItem('purnya_addresses', JSON.stringify(cloudAddrs));
          } catch { }
        }
      });
      loadOrders();
    }
    showToast('Welcome to Purnya', `Signed in as ${profile.name || profile.email}`);
  };

  const logoutUser = () => {
    setUser({ id: undefined, name: '', email: '', phone: '' });
    setAddresses([]);
    try {
      localStorage.removeItem('purnya_user');
      localStorage.removeItem('purnya_addresses');
    } catch { }
    // Only sign out from Supabase if the user does NOT have an active admin session,
    // so customer sign-out does not invalidate the admin dashboard session
    if (!readAdminSession()) {
      signOutFromSupabase().catch(() => { });
    }
    showToast('Signed Out', 'You have been safely signed out.', 'info');
  };


  const addAddress = (address: Omit<Address, 'id'>) => {
    const id = `addr-${Date.now()}`;
    const newAddr: Address = { ...address, id };
    setAddresses(prev => {
      const updated = [newAddr, ...prev];
      try {
        localStorage.setItem('purnya_addresses', JSON.stringify(updated));
      } catch { }
      return updated;
    });
    showToast('Address Saved', 'New delivery address added.');

    if (user?.email) {
      saveAddressToSupabase(newAddr, user.email, user.id).catch(err =>
        console.warn('Supabase saveAddress error:', err)
      );
    }
  };

  const updateAddress = (id: string, updates: Partial<Address>) => {
    setAddresses(prev => {
      const updated = prev.map(a => (a.id === id ? { ...a, ...updates } : a));
      try {
        localStorage.setItem('purnya_addresses', JSON.stringify(updated));
      } catch { }
      return updated;
    });
    showToast('Address Updated', 'Saved delivery address updated.');

    if (user?.email) {
      updateAddressInSupabase(id, updates, user.email).catch(err =>
        console.warn('Supabase updateAddress error:', err)
      );
    }
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => {
      const updated = prev.filter(a => a.id !== id);
      try {
        localStorage.setItem('purnya_addresses', JSON.stringify(updated));
      } catch { }
      return updated;
    });
    showToast('Address Deleted', undefined, 'info');

    deleteAddressFromSupabase(id).catch(err =>
      console.warn('Supabase deleteAddress error:', err)
    );
  };

  const syncCatalogToSupabase = async () => {
    showToast('Syncing with Supabase...', 'Uploading catalog to cloud database.', 'info');
    const result = await seedCatalogToSupabase(categories, products);
    if (result.success) {
      showToast('Supabase Synced!', result.message, 'success');
      const freshStatus = await checkSupabaseConnection();
      setSupabaseStatus(freshStatus);
    } else {
      showToast('Supabase Notice', result.message, 'info');
    }
    return result;
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        cart,
        wishlist,
        orders,
        refreshOrders: loadOrders,
        coupons,
        banners,
        heroBanners,
        markHeroReady,
        bannersLoaded,
        bannersError,
        retryBanners,
        announcement,
        user,
        isAuthLoading,
        mounted,
        addresses,
        appliedCoupon,
        toast,
        authModal,
        openAuthModal,
        closeAuthModal,
        isSearchOpen,
        setIsSearchOpen,
        supabaseStatus,
        syncCatalogToSupabase,
        showToast,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isInWishlist,
        applyCoupon,
        removeCoupon,
        syncCartPrices,
        recordPlacedOrder,
        cartSubtotal,
        cartDiscount,
        cartShipping,
        cartTotal,
        cartCount,
        wishlistCount,
        addProduct,
        updateProduct,
        deleteProduct,
        updateOrderStatus,
        addCategorySubcategory,
        updateCategorySubcategory,
        removeCategorySubcategory,
        updateCategory,
        addCoupon,
        updateCoupon,
        toggleCoupon,
        deleteCoupon,
        addHeroSlide,
        updateHeroSlide,
        deleteHeroSlide,
        reorderBanners,
        updateBannerPriority,
        saveAllBannerPriorities,
        updateAnnouncement,
        updateUser,
        loginUser,
        logoutUser,
        addAddress,
        updateAddress,
        deleteAddress,
        refreshCatalog,
      }}
    >
      {children}
      {isGlobalLoading && !isAdminPage && (
        <div
          className={`fixed inset-0 z-[999999] bg-[#08281F] text-[#FAF8F5] flex flex-col items-center justify-center p-6 overflow-hidden select-none transition-opacity duration-500 ${
            fadeOutLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Glowing atmospheric backdrop */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/15 rounded-full blur-[130px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#C5A059]/15 rounded-full blur-[130px] pointer-events-none animate-pulse" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-md mx-auto">
            {/* Glowing Emblem Logo */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FAF8F5] p-1.5 border-2 border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.4)] flex items-center justify-center animate-pulse">
                <img
                  src="/logoicon.png"
                  alt="Purnya Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Outer Golden Spinner Ring */}
              <div
                className="absolute inset-0 -m-3 border-2 border-[#D4AF37] border-t-transparent border-b-transparent rounded-full animate-spin"
                style={{ animationDuration: '3s' }}
              />
            </div>

            {/* Brand Identity */}
            <div className="space-y-2">
              <h1 className="font-serif-title text-4xl sm:text-5xl font-bold tracking-[0.25em] text-white leading-none">
                PURNYA
              </h1>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Thoughtfully · Curated · Beautifully Yours
              </p>
            </div>

            {/* Progress Bar & Subtitle */}
            <div className="space-y-4 pt-4 w-full">
              <p className="text-xs sm:text-sm text-[#E8F0EC]/90 font-medium tracking-widest uppercase">
                Opening Purnya Luxury Sanctuary...
              </p>

              <div className="w-64 sm:w-80 h-1.5 bg-[#144234] rounded-full overflow-hidden mx-auto p-0.5 shadow-inner">
                <div className="h-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#E6C25B] rounded-full animate-pulse w-full transition-all duration-1000" />
              </div>
            </div>
          </div>
        </div>
      )}

    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};