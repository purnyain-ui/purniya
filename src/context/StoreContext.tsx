'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  isSupabaseConfigured,
  checkSupabaseConnection,
  getProductsFromSupabase,
  getCategoriesFromSupabase,
  saveOrderToSupabase,
  seedCatalogToSupabase,
} from '../lib/supabase';

interface ToastState {
  id: string;
  title: string;
  desc?: string;
  type?: 'success' | 'info' | 'error';
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

  // Admin Actions
  addProduct: (newProd: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string, courierPartner?: string) => void;
  addCategorySubcategory: (categorySlug: string, subcategoryName: string) => void;
  addCoupon: (coupon: Coupon) => void;
  toggleCoupon: (code: string) => void;
  updateHeroSlide: (slide: HeroSlide) => void;
  updateAnnouncement: (text: string) => void;
  updateUser: (profile: Partial<UserProfile>) => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Supabase Cloud Status & Initialization
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    message: string;
    projectRef: string;
    tablesFound?: string[];
  }>({
    connected: false,
    message: 'Testing connection to Supabase cloud...',
    projectRef: 'bhzjtyyxgtoasvpbvfsn',
  });

  useEffect(() => {
    checkSupabaseConnection().then((status) => {
      setSupabaseStatus(status);
      if (status.connected && status.tablesFound?.includes('products')) {
        getProductsFromSupabase().then((prods) => {
          if (prods && prods.length > 0) setProducts(prods);
        });
        getCategoriesFromSupabase().then((cats) => {
          if (cats && cats.length > 0) setCategories(cats);
        });
      }
    });
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem('purnya_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedCategories = localStorage.getItem('purnya_categories');
      if (savedCategories) {
        try {
          const parsed = JSON.parse(savedCategories);
          const sanitized = initialCategories.map((initCat) => {
            const found = parsed.find((p: any) => p.slug === initCat.slug);
            return {
              ...initCat,
              ...(found || {}),
              subcategories: found?.subcategories || initCat.subcategories,
              subcatImages: (found?.subcatImages && found.subcatImages.length > 0)
                ? found.subcatImages
                : initCat.subcatImages,
            };
          });
          setCategories(sanitized);
        } catch {
          setCategories(initialCategories);
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
          const parsedOrders: Order[] = JSON.parse(savedOrders);
          const cleanOrders = parsedOrders.filter(
            (o) => o.id !== 'PUR-2026-8492' && o.id !== 'PUR-2026-7310' && o.customer?.name !== 'Priya Sharma'
          );
          setOrders(cleanOrders);
        } catch {
          setOrders([]);
        }
      }

      const savedCoupons = localStorage.getItem('purnya_coupons');
      if (savedCoupons) setCoupons(JSON.parse(savedCoupons));

      const savedBanners = localStorage.getItem('purnya_banners');
      if (savedBanners) setBanners(JSON.parse(savedBanners));

      const savedAnnouncement = localStorage.getItem('purnya_announcement');
      if (savedAnnouncement) setAnnouncement(savedAnnouncement);

      const savedAddresses = localStorage.getItem('purnya_addresses');
      if (savedAddresses) {
        try {
          const parsedAddrs: Address[] = JSON.parse(savedAddresses);
          const cleanAddrs = parsedAddrs.filter(
            (a) => a.fullName !== 'Priya Sharma' && !a.addressLine?.includes('Rose Garden Lane')
          );
          setAddresses(cleanAddrs);
        } catch {
          setAddresses([]);
        }
      }

      const savedUser = localStorage.getItem('purnya_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.name === 'Priya Sharma') {
            setUser({ name: '', email: '', phone: '' });
          } else {
            setUser(parsed);
          }
        } catch {
          setUser({ name: '', email: '', phone: '' });
        }
      }
    } catch (e) {
      console.warn('LocalStorage load error', e);
    }
    setMounted(true);
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
    showToast('Added to Cart', `${product.name} (Qty: ${quantity})`);
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
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        showToast('Removed from Wishlist', product.name, 'info');
        return prev.filter(item => item.id !== product.id);
      } else {
        showToast('Saved to Wishlist', product.name, 'success');
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
      return Math.round((cartSubtotal * appliedCoupon.discountValue) / 100);
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
    return productWithId;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Product Updated', 'Changes saved successfully.');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
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
  const addCategorySubcategory = (categorySlug: string, subcategoryName: string) => {
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
                  image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=200&fit=crop&auto=format',
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

  // Admin Coupons
  const addCoupon = (coupon: Coupon) => {
    setCoupons(prev => [coupon, ...prev]);
    showToast('Coupon Created', `Coupon code ${coupon.code} is active.`);
  };

  const toggleCoupon = (code: string) => {
    setCoupons(prev =>
      prev.map(c => (c.code === code ? { ...c, isActive: !c.isActive } : c))
    );
  };

  // Admin Banners
  const updateHeroSlide = (slide: HeroSlide) => {
    setBanners(prev => prev.map(s => (s.id === slide.id ? slide : s)));
    showToast('Banner Updated', 'Homepage hero slide updated.');
  };

  const updateAnnouncement = (text: string) => {
    setAnnouncement(text);
    showToast('Announcement Updated', 'Store announcement bar refreshed.');
  };

  // User & Addresses
  const updateUser = (profile: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...profile }));
    showToast('Profile Updated', 'Personal information saved.');
  };

  const addAddress = (address: Omit<Address, 'id'>) => {
    const id = `addr-${Date.now()}`;
    setAddresses(prev => [...prev, { ...address, id }]);
    showToast('Address Saved', 'New delivery address added.');
  };

  const updateAddress = (id: string, updates: Partial<Address>) => {
    setAddresses(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    showToast('Address Updated', 'Saved delivery address updated.');
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    showToast('Address Deleted', undefined, 'info');
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
        addCoupon,
        toggleCoupon,
        updateHeroSlide,
        updateAnnouncement,
        updateUser,
        addAddress,
        updateAddress,
        deleteAddress,
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
