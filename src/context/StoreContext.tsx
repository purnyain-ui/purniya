'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
} from '../data/mockData';
import {
  checkSupabaseConnection,
  getProductsFromSupabase,
  getCategoriesFromSupabase,
  saveOrderToSupabase,
  seedCatalogToSupabase,
  upsertProductToSupabase,
  deleteProductFromSupabase,
  getBannersFromSupabase,
  upsertBannerToSupabase,
  deleteBannerFromSupabase,
  seedBannersToSupabase,
  getAnnouncementFromSupabase,
  saveAnnouncementToSupabase,
  getAddressesFromSupabase,
  saveAddressToSupabase,
  updateAddressInSupabase,
  deleteAddressFromSupabase,
  getOrdersForCustomerFromSupabase,
  getAllOrdersFromSupabase,
  getCouponsFromSupabase,
  saveCouponToSupabase,
  toggleCouponInSupabase,
  deleteCouponFromSupabase,
  signOutFromSupabase,
  supabase,
} from '../lib/supabase';

interface ToastState {
  id: string;
  title: string;
  desc?: string;
  type?: 'success' | 'info' | 'error';
}

export interface AuthModalState {
  isOpen: boolean;
  actionType?: 'order' | 'wishlist' | 'bag';
  title?: string;
  message?: string;
  redirectUrl?: string;
}

interface StoreContextType {
  products: Product[];
  categories: CategoryMeta[];
  cart: CartItem[];
  wishlist: Product[];
  orders: Order[];
  coupons: Coupon[];
  banners: HeroSlide[];
  announcement: string;
  user: UserProfile;
  addresses: Address[];
  appliedCoupon: Coupon | null;
  toast: ToastState | null;
  authModal: AuthModalState | null;
  openAuthModal: (options?: {
    actionType?: 'order' | 'wishlist' | 'bag';
    title?: string;
    message?: string;
    redirectUrl?: string;
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
  placeOrder: (details: {
    customer: { name: string; email: string; phone: string };
    shippingAddress: Address;
    paymentMethod: Order['paymentMethod'];
  }) => Order;

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
  updateAnnouncement: (text: string) => void;
  updateUser: (profile: Partial<UserProfile>) => void;
  loginUser: (profile: UserProfile) => void;
  logoutUser: () => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  refreshCatalog: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Client-side initialization flag
  const [mounted, setMounted] = useState(false);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryMeta[]>(initialCategories);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [banners, setBanners] = useState<HeroSlide[]>(initialHeroSlides);
  const [announcement, setAnnouncement] = useState<string>(
    'Free Express Shipping on Orders Above ₹999  |  Cash on Delivery Available Pan-India'
  );
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [authModal, setAuthModal] = useState<AuthModalState | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openAuthModal = (options?: {
    actionType?: 'order' | 'wishlist' | 'bag';
    title?: string;
    message?: string;
    redirectUrl?: string;
  }) => {
    setAuthModal({
      isOpen: true,
      actionType: options?.actionType || 'order',
      title: options?.title,
      message: options?.message,
      redirectUrl: options?.redirectUrl || (typeof window !== 'undefined' ? window.location.pathname : '/'),
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
        setCategories(cats);
        try {
          localStorage.setItem('purnya_categories', JSON.stringify(cats));
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }
      }
    });

    // Fetch real products with real uploaded images directly from Supabase immediately on mount
    getProductsFromSupabase().then((prods) => {
      if (prods && prods.length > 0) {
        const dbIds = new Set(prods.map(p => p.id));
        const remaining = initialProducts.filter(p => !dbIds.has(p.id));
        const merged = [...prods, ...remaining];
        setProducts(merged);
        try {
          localStorage.setItem('purnya_products', JSON.stringify(merged));
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }
      }
    });

    // Fetch all store orders from Supabase immediately on mount
    getAllOrdersFromSupabase().then((dbOrders) => {
      if (dbOrders && dbOrders.length > 0) {
        setOrders(prev => {
          const dbIds = new Set(dbOrders.map(o => o.id));
          const localOnly = prev.filter(o => !dbIds.has(o.id));
          const merged = [...dbOrders, ...localOnly];
          try {
            localStorage.setItem('purnya_orders', JSON.stringify(merged));
          } catch { }
          return merged;
        });
      }
    });

    checkSupabaseConnection().then((status) => {
      setSupabaseStatus(status);
      if (status.connected) {
        getCategoriesFromSupabase().then((cats) => {
          if (cats && cats.length > 0) {
            setCategories(cats);
            try {
              localStorage.setItem('purnya_categories', JSON.stringify(cats));
            } catch (e) {
              console.warn('LocalStorage save error:', e);
            }
          }
        });

        if (status.tablesFound?.includes('products')) {
          getProductsFromSupabase().then((prods) => {
            if (prods && prods.length > 0) {
              const dbIds = new Set(prods.map(p => p.id));
              const remaining = initialProducts.filter(p => !dbIds.has(p.id));
              const merged = [...prods, ...remaining];
              setProducts(merged);
              try {
                localStorage.setItem('purnya_products', JSON.stringify(merged));
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
              saveAnnouncementToSupabase('Free Express Shipping on Orders Above ₹999  |  Cash on Delivery Available Pan-India');
            }
          });

          getBannersFromSupabase().then((dbBanners) => {
            if (dbBanners && dbBanners.length > 0) {
              setBanners(dbBanners);
              try {
                localStorage.setItem('purnya_banners', JSON.stringify(dbBanners));
              } catch (e) {
                console.warn('LocalStorage save error:', e);
              }
            } else if (dbBanners && dbBanners.length === 0) {
              // Auto-seed default luxury banners if table is empty
              seedBannersToSupabase(initialHeroSlides).then(() => {
                setBanners(initialHeroSlides);
                try {
                  localStorage.setItem('purnya_banners', JSON.stringify(initialHeroSlides));
                } catch { }
              });
            }
          });
        }
      }
    });

    // Real-time Supabase Auth state listener & sync
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u = session.user;
          const meta = u.user_metadata || {};
          const currentEmail = u.email || '';
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

          // Fetch customer cloud orders
          getOrdersForCustomerFromSupabase(currentEmail).then((cloudOrders) => {
            if (cloudOrders && cloudOrders.length > 0) {
              setOrders(prev => {
                const dbIds = new Set(cloudOrders.map(o => o.id));
                const localOnly = prev.filter(o => !dbIds.has(o.id));
                const merged = [...cloudOrders, ...localOnly];
                try {
                  localStorage.setItem('purnya_orders', JSON.stringify(merged));
                } catch { }
                return merged;
              });
            }
          });
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          const u = session.user;
          const meta = u.user_metadata || {};
          const currentEmail = u.email || '';
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

          const cloudAddrs = await getAddressesFromSupabase(currentEmail);
          if (cloudAddrs && cloudAddrs.length > 0) {
            setAddresses(cloudAddrs);
            try {
              localStorage.setItem('purnya_addresses', JSON.stringify(cloudAddrs));
            } catch { }
          }

          const cloudOrders = await getOrdersForCustomerFromSupabase(currentEmail);
          if (cloudOrders && cloudOrders.length > 0) {
            setOrders(prev => {
              const dbIds = new Set(cloudOrders.map(o => o.id));
              const localOnly = prev.filter(o => !dbIds.has(o.id));
              const merged = [...cloudOrders, ...localOnly];
              try {
                localStorage.setItem('purnya_orders', JSON.stringify(merged));
              } catch { }
              return merged;
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser({ id: undefined, name: '', email: '', phone: '' });
          setAddresses([]);
          try {
            localStorage.removeItem('purnya_user');
            localStorage.removeItem('purnya_addresses');
          } catch { }
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
        getBannersFromSupabase(),
        getAnnouncementFromSupabase(),
        getCouponsFromSupabase(),
      ]);
      if (prods && prods.length > 0) {
        const dbIds = new Set(prods.map(p => p.id));
        const remaining = initialProducts.filter(p => !dbIds.has(p.id));
        const merged = [...prods, ...remaining];
        setProducts(merged);
        try {
          localStorage.setItem('purnya_products', JSON.stringify(merged));
        } catch { }
      }
      if (cats && cats.length > 0) {
        setCategories(cats);
        try {
          localStorage.setItem('purnya_categories', JSON.stringify(cats));
        } catch { }
      }
      if (dbBanners && dbBanners.length > 0) {
        setBanners(dbBanners);
        try {
          localStorage.setItem('purnya_banners', JSON.stringify(dbBanners));
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
  }, []);

  // Listen for catalog updates from admin actions
  useEffect(() => {
    const handleCatalogUpdated = () => {
      refreshCatalog();
    };
    window.addEventListener('purnya_catalog_updated', handleCatalogUpdated);
    return () => window.removeEventListener('purnya_catalog_updated', handleCatalogUpdated);
  }, [refreshCatalog]);

  // Load from localStorage on mount safely
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedProducts = localStorage.getItem('purnya_products');
        if (savedProducts) {
          try {
            const parsedProds: Product[] = JSON.parse(savedProducts);
            if (Array.isArray(parsedProds) && parsedProds.length > 0) {
              setProducts(parsedProds);
            }
          } catch { }
        }

        const savedCategories = localStorage.getItem('purnya_categories');
        if (savedCategories) {
          try {
            const parsed = JSON.parse(savedCategories);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCategories(parsed);
            }
          } catch {
            // Keep current state
          }
        }

        const savedCart = localStorage.getItem('purnya_cart');
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedWishlist = localStorage.getItem('purnya_wishlist');
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist));
        } else {
          setWishlist([]);
        }

        const savedOrders = localStorage.getItem('purnya_orders');
        if (savedOrders) {
          try {
            const parsedOrders = JSON.parse(savedOrders);
            setOrders(parsedOrders);
          } catch {
            setOrders([]);
          }
        }

        const savedCoupons = localStorage.getItem('purnya_coupons');
        if (savedCoupons) setCoupons(JSON.parse(savedCoupons));

        const savedBanners = localStorage.getItem('purnya_banners');
        if (savedBanners) {
          try {
            const parsed = JSON.parse(savedBanners);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBanners(parsed);
            } else {
              setBanners(initialHeroSlides);
            }
          } catch {
            setBanners(initialHeroSlides);
          }
        }

        const savedAnnouncement = localStorage.getItem('purnya_announcement');
        if (savedAnnouncement) setAnnouncement(savedAnnouncement);

        const savedAddresses = localStorage.getItem('purnya_addresses');
        if (savedAddresses) {
          try {
            const parsedAddrs = JSON.parse(savedAddresses);
            setAddresses(parsedAddrs);
          } catch {
            setAddresses([]);
          }
        }

        const savedUser = localStorage.getItem('purnya_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch {
            setUser({ id: undefined, name: '', email: '', phone: '' });
          }
        }
      } catch (e) {
        console.warn('LocalStorage load error', e);
      }
      setMounted(true);
    });
  }, []);

  // Real-time synchronization across multiple open browser tabs/windows
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'purnya_cart') setCart(JSON.parse(e.newValue));
        if (e.key === 'purnya_wishlist') setWishlist(JSON.parse(e.newValue));
        if (e.key === 'purnya_orders') setOrders(JSON.parse(e.newValue));
        if (e.key === 'purnya_user') setUser(JSON.parse(e.newValue));
        if (e.key === 'purnya_addresses') setAddresses(JSON.parse(e.newValue));
        if (e.key === 'purnya_products') setProducts(JSON.parse(e.newValue));
        if (e.key === 'purnya_categories') setCategories(JSON.parse(e.newValue));
        if (e.key === 'purnya_banners') setBanners(JSON.parse(e.newValue));
        if (e.key === 'purnya_announcement') setAnnouncement(e.newValue);
      } catch (err) {
        console.warn('Cross-tab storage sync error', err);
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('purnya_products', JSON.stringify(products));
      localStorage.setItem('purnya_categories', JSON.stringify(categories));
      localStorage.setItem('purnya_cart', JSON.stringify(cart));
      localStorage.setItem('purnya_wishlist', JSON.stringify(wishlist));
      localStorage.setItem('purnya_orders', JSON.stringify(orders));
      localStorage.setItem('purnya_coupons', JSON.stringify(coupons));
      localStorage.setItem('purnya_banners', JSON.stringify(banners));
      localStorage.setItem('purnya_announcement', announcement);
      localStorage.setItem('purnya_addresses', JSON.stringify(addresses));
      localStorage.setItem('purnya_user', JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [mounted, products, categories, cart, wishlist, orders, coupons, banners, announcement, addresses, user]);

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
      openAuthModal({
        actionType: 'bag',
        title: 'Add to Your Bag 🛍️',
        message: 'Please sign in to add pieces to your shopping bag and enjoy uninterrupted shopping.',
        redirectUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
      });
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
      openAuthModal({
        actionType: 'wishlist',
        title: 'Save to Your Wishlist ✨',
        message: 'Please sign in to keep your favorite pieces saved in your personal wishlist collection across all your devices.',
        redirectUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
      });
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
    if (!appliedCoupon) return 0;
    if (cartSubtotal < appliedCoupon.minOrderValue) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      const calculated = Math.round((cartSubtotal * appliedCoupon.discountValue) / 100);
      return appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    }
    return Math.min(appliedCoupon.discountValue, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const cartShipping = useMemo(() => {
    if (cart.length === 0) return 0;
    return cartSubtotal >= 999 ? 0 : 99;
  }, [cart, cartSubtotal]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - cartDiscount + cartShipping);
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
    if (cartSubtotal < found.minOrderValue) {
      return {
        success: false,
        message: `Minimum order value of ₹${found.minOrderValue} required for this coupon.`,
      };
    }

    const now = new Date();
    if (found.validFrom && new Date(found.validFrom) > now) {
      return {
        success: false,
        message: `This coupon will be active starting ${new Date(found.validFrom).toLocaleDateString('en-IN')}.`,
      };
    }
    if (found.validUntil && new Date(found.validUntil) < now) {
      return {
        success: false,
        message: 'This promo code has expired.',
      };
    }
    if (found.usageLimit && (found.usageCount || 0) >= found.usageLimit) {
      return {
        success: false,
        message: 'This coupon has reached its maximum redemption limit.',
      };
    }

    setAppliedCoupon(found);
    showToast('Coupon Applied!', `You unlocked ${found.code} savings.`);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon Removed', undefined, 'info');
  };

  // Place Order
  const placeOrder = (details: {
    customer: { name: string; email: string; phone: string };
    shippingAddress: Address;
    paymentMethod: Order['paymentMethod'];
  }): Order => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrderId = `PUR-2026-${randomSuffix}`;
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const orderItems = cart.map(c => ({
      id: c.product.id,
      name: c.product.name,
      price: c.product.price,
      quantity: c.quantity,
      image: c.product.image,
      category: c.product.category,
      variant: c.selectedVariant ? Object.values(c.selectedVariant).join(', ') : undefined,
    }));

    const newOrder: Order = {
      id: newOrderId,
      date: today,
      status: 'New',
      items: orderItems,
      subtotal: cartSubtotal,
      discount: cartDiscount,
      couponCode: appliedCoupon?.code,
      shipping: cartShipping,
      total: cartTotal,
      customer: details.customer,
      shippingAddress: details.shippingAddress,
      paymentMethod: details.paymentMethod,
      trackingNumber: `BD-${randomSuffix}992IN`,
      courierPartner: 'BlueDart Express',
      estimatedDelivery: '3 - 5 Business Days',
      trackingHistory: [
        {
          status: 'Order Placed & Confirmed',
          time: `${today}, Just Now`,
          location: 'Purnya.in Online Platform',
          completed: true,
        },
        {
          status: 'Order Verified & Preparing for Dispatch',
          time: 'Upcoming',
          location: 'Purnya Central Warehouse',
          completed: false,
        },
        {
          status: 'Dispatched with Courier',
          time: 'Upcoming',
          location: 'Bengaluru Logistics Hub',
          completed: false,
        },
        {
          status: 'Delivered',
          time: 'Upcoming',
          location: 'Customer Address',
          completed: false,
        },
      ],
    };

    setOrders(prev => [newOrder, ...prev]);

    // Increment coupon usage count
    if (appliedCoupon) {
      setCoupons(prev =>
        prev.map(c => {
          if (c.code === appliedCoupon.code) {
            const nextCount = (c.usageCount || 0) + 1;
            const updated = { ...c, usageCount: nextCount };
            saveCouponToSupabase(updated).catch(() => { });
            return updated;
          }
          return c;
        })
      );
    }

    clearCart();
    showToast('Order Placed!', `Your Order #${newOrderId} has been confirmed.`, 'success');

    // Sync order to Supabase cloud in background
    saveOrderToSupabase(newOrder).catch(err =>
      console.warn('Supabase saveOrder background sync:', err)
    );

    return newOrder;
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
    setOrders(prev =>
      prev.map(ord => {
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

          return {
            ...ord,
            status,
            trackingNumber: trackingNumber || ord.trackingNumber,
            courierPartner: courierPartner || ord.courierPartner,
            trackingHistory: updatedHistory,
          };
        }
        return ord;
      })
    );
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
    setBanners(prev => [slide, ...prev]);
    showToast('Banner Added', 'New homepage hero banner created.');
    upsertBannerToSupabase(slide).catch((err) => {
      console.warn('Supabase banner save error:', err);
    });
  };

  const updateHeroSlide = (slide: HeroSlide) => {
    setBanners(prev => prev.map(s => (s.id === slide.id ? slide : s)));
    showToast('Banner Updated', 'Homepage hero slide updated.');
    upsertBannerToSupabase(slide).catch((err) => {
      console.warn('Supabase banner update error:', err);
    });
  };

  const deleteHeroSlide = (id: string) => {
    setBanners(prev => prev.filter(s => s.id !== id));
    showToast('Banner Deleted', 'Homepage hero slide removed.');
    deleteBannerFromSupabase(id).catch((err) => {
      console.warn('Supabase banner delete error:', err);
    });
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
      getOrdersForCustomerFromSupabase(profile.email).then((cloudOrders) => {
        if (cloudOrders && cloudOrders.length > 0) {
          setOrders(prev => {
            const dbIds = new Set(cloudOrders.map(o => o.id));
            const localOnly = prev.filter(o => !dbIds.has(o.id));
            const merged = [...cloudOrders, ...localOnly];
            try {
              localStorage.setItem('purnya_orders', JSON.stringify(merged));
            } catch { }
            return merged;
          });
        }
      });
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
    signOutFromSupabase().catch(() => { });
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
      saveAddressToSupabase(newAddr, user.email).catch(err =>
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
        coupons,
        banners,
        announcement,
        user,
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
        placeOrder,
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