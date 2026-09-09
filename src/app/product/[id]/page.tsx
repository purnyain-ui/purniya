'use client';

import React, { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Star,
  CheckCircle2,
  ArrowUpRight,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { supabase } from '../../../lib/supabaseClient';

// ---------------------------------------------------------------
// This page fetches everything it shows directly from Supabase —
// it does NOT read from StoreContext's preloaded `products` list,
// because that list doesn't carry variant / color / size / image
// detail the way the admin "Add Product" form saves it.
//
// StoreContext is still used for actions that need shared app
// state: cart, wishlist, and the auth modal.
// ---------------------------------------------------------------

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  lifestyle_tag_id: string | null;
  is_featured: boolean | null;
  has_variants: boolean | null;
  price: number | null;
  selling_price: number | null;
  stock: number | null;
  is_active: boolean | null;
};

type CategoryInfo = { id: string; title: string; slug: string };
type SubcategoryInfo = { id: string; name: string };
type LifestyleInfo = { id: string; name: string | null };
type ColorInfo = { id: string; name: string; hex: string };
type SizeInfo = { id: string; name: string; dimension: string };

type VariantInfo = {
  id: string;
  color_id: string | null;
  size_id: string | null;
  sku: string | null;
  price: number | null;
  selling_price: number | null;
  stock: number | null;
  color: ColorInfo | null;
  size: SizeInfo | null;
  images: string[];
};

type RelatedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  selling_price: number | null;
  image: string;
};

type FullProduct = {
  product: ProductRow;
  category: CategoryInfo | null;
  subcategory: SubcategoryInfo | null;
  lifestyle: LifestyleInfo | null;
  features: string[];
  images: string[];
  variants: VariantInfo[];
};

// ---------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------
type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

type ReviewStats = {
  review_count: number;
  average_rating: number; // defaults to 5 when there are no reviews yet
};

async function fetchFullProduct(id: string): Promise<FullProduct | null> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (productError || !product) return null;

  const [
    categoryRes,
    subcategoryRes,
    lifestyleRes,
    featuresRes,
  ] = await Promise.all([
    product.category_id
      ? supabase.from('categories').select('id,title,slug').eq('id', product.category_id).single()
      : Promise.resolve({ data: null }),
    product.subcategory_id
      ? supabase.from('subcategories').select('id,name').eq('id', product.subcategory_id).single()
      : Promise.resolve({ data: null }),
    product.lifestyle_tag_id
      ? supabase.from('lifestyle_sale_tags').select('id,name').eq('id', product.lifestyle_tag_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('product_features')
      .select('feature')
      .eq('product_id', id)
      .order('sort_order'),
  ]);

  let images: string[] = [];
  let variants: VariantInfo[] = [];

  if (!product.has_variants) {
    const { data: imagesData } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', id)
      .order('sort_order');
    images = (imagesData || []).map((row: { image_url: string }) => row.image_url);
  } else {
    const { data: variantRows } = await supabase
      .from('product_variants')
      .select('id,color_id,size_id,sku,price,selling_price,stock')
      .eq('product_id', id)
      .eq('is_active', true)
      .order('created_at');

    const colorIds = Array.from(
      new Set((variantRows || []).map((v: any) => v.color_id).filter(Boolean))
    );
    const sizeIds = Array.from(
      new Set((variantRows || []).map((v: any) => v.size_id).filter(Boolean))
    );
    const variantIds = (variantRows || []).map((v: any) => v.id);

    const [colorsRes, sizesRes, variantImagesRes] = await Promise.all([
      colorIds.length > 0
        ? supabase.from('color_palettes').select('id,name,hex').in('id', colorIds)
        : Promise.resolve({ data: [] }),
      sizeIds.length > 0
        ? supabase.from('size_variants').select('id,name,dimension').in('id', sizeIds)
        : Promise.resolve({ data: [] }),
      variantIds.length > 0
        ? supabase
          .from('product_variant_images')
          .select('variant_id,image_url,sort_order')
          .in('variant_id', variantIds)
          .order('sort_order')
        : Promise.resolve({ data: [] }),
    ]);

    const colorsById = new Map<string, ColorInfo>(
      (colorsRes.data || []).map((c: ColorInfo) => [c.id, c])
    );
    const sizesById = new Map<string, SizeInfo>(
      (sizesRes.data || []).map((s: SizeInfo) => [s.id, s])
    );
    const imagesByVariant = new Map<string, string[]>();
    (variantImagesRes.data || []).forEach((row: { variant_id: string; image_url: string }) => {
      const list = imagesByVariant.get(row.variant_id) || [];
      list.push(row.image_url);
      imagesByVariant.set(row.variant_id, list);
    });

    variants = (variantRows || []).map((v: any) => ({
      id: v.id,
      color_id: v.color_id,
      size_id: v.size_id,
      sku: v.sku,
      price: v.price,
      selling_price: v.selling_price,
      stock: v.stock,
      color: v.color_id ? colorsById.get(v.color_id) || null : null,
      size: v.size_id ? sizesById.get(v.size_id) || null : null,
      images: imagesByVariant.get(v.id) || [],
    }));
  }

  return {
    product: product as ProductRow,
    category: (categoryRes as any).data || null,
    subcategory: (subcategoryRes as any).data || null,
    lifestyle: (lifestyleRes as any).data || null,
    features: (featuresRes.data || []).map((row: { feature: string }) => row.feature),
    images,
    variants,
  };
}

async function fetchThumbnail(productId: string, hasVariants: boolean): Promise<string> {
  if (!hasVariants) {
    const { data } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId)
      .order('sort_order')
      .limit(1)
      .maybeSingle();
    return data?.image_url || '';
  }

  const { data: variant } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!variant) return '';

  const { data: image } = await supabase
    .from('product_variant_images')
    .select('image_url')
    .eq('variant_id', variant.id)
    .order('sort_order')
    .limit(1)
    .maybeSingle();

  return image?.image_url || '';
}

async function fetchRelatedProducts(
  categoryId: string | null,
  excludeId: string
): Promise<RelatedProduct[]> {
  if (!categoryId) return [];

  const { data } = await supabase
    .from('products')
    .select('id,name,slug,price,selling_price,has_variants')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .neq('id', excludeId)
    .limit(4);

  if (!data || data.length === 0) return [];

  const withThumbnails = await Promise.all(
    data.map(async (row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      selling_price: row.selling_price,
      image: await fetchThumbnail(row.id, row.has_variants),
    }))
  );

  return withThumbnails;
}

// ---------------------------------------------------------------
// Reviews: fetch helpers
// ---------------------------------------------------------------
async function fetchReviews(productId: string): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as ReviewRow[];
}

function computeStats(reviews: ReviewRow[]): ReviewStats {
  if (reviews.length === 0) {
    // No reviews yet — show the "quality assured" default of 5 stars.
    return { review_count: 0, average_rating: 5 };
  }
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    review_count: reviews.length,
    average_rating: Math.round((total / reviews.length) * 10) / 10,
  };
}

// ---------------------------------------------------------------
// Star rating — read-only display, or interactive picker for the
// "write a review" form.
// ---------------------------------------------------------------
function StarRating({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? rating;

  // Read-only mode renders <span>s (never <button>s), since this
  // component is sometimes placed inside another clickable element
  // (e.g. a button that jumps to the Reviews tab) — nesting a real
  // <button> inside another <button> is invalid HTML and breaks React.
  if (!interactive) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = displayValue >= star - 0.5;
          return (
            <span key={star} aria-hidden="true">
              <Star
                style={{ width: size, height: size }}
                className={`${filled ? 'fill-current' : 'fill-none'} text-[#C5A059]`}
              />
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayValue >= star - 0.5;
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={() => onChange?.(star)}
            className="cursor-pointer"
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={`${filled ? 'fill-current' : 'fill-none'} text-[#C5A059]`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const { addToCart, toggleWishlist, isInWishlist, user, openAuthModal } = useStore();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<FullProduct | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);

  const [quantity, setQuantity] = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState('');
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'care' | 'reviews'>('desc');

  // Reviews state
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ review_count: 0, average_rating: 5 });
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setNotFound(false);
    setData(null);
    setRelated([]);
    setQuantity(1);
    setActiveImgIndex(0);
    setSelectedColorId('');
    setSelectedSizeId('');
    setReviews([]);
    setReviewStats({ review_count: 0, average_rating: 5 });
    setNewRating(5);
    setNewComment('');
    setReviewError('');

    fetchFullProduct(id).then(async (result) => {
      if (isCancelled) return;
      if (!result) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setData(result);
      setLoading(false);

      const [relatedList, reviewsList] = await Promise.all([
        fetchRelatedProducts(result.product.category_id, result.product.id),
        fetchReviews(result.product.id),
      ]);

      if (!isCancelled) {
        setRelated(relatedList);
        setReviews(reviewsList);
        setReviewStats(computeStats(reviewsList));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [id]);

  // If the signed-in user already has a review for this product, load it
  // into the form so "Submit" naturally becomes "Update".
  useEffect(() => {
    if (!user?.id) return;
    const existing = reviews.find((r) => r.user_id === user.id);
    if (existing) {
      setNewRating(existing.rating);
      setNewComment(existing.comment || '');
    }
  }, [reviews, user]);

  const hasReviewed = useMemo(
    () => Boolean(user?.id) && reviews.some((r) => r.user_id === user.id),
    [reviews, user]
  );

  const variants = data?.variants || [];

  const uniqueColors = useMemo(() => {
    const map = new Map<string, ColorInfo>();
    variants.forEach((v) => {
      if (v.color) map.set(v.color.id, v.color);
    });
    return Array.from(map.values());
  }, [variants]);

  const sizesForSelectedColor = useMemo(() => {
    const map = new Map<string, SizeInfo>();
    variants
      .filter((v) => !selectedColorId || v.color_id === selectedColorId)
      .forEach((v) => {
        if (v.size) map.set(v.size.id, v.size);
      });
    return Array.from(map.values());
  }, [variants, selectedColorId]);

  // Pick sensible defaults once variant data is available.
  useEffect(() => {
    if (uniqueColors.length > 0 && !selectedColorId) {
      setSelectedColorId(uniqueColors[0].id);
    }
  }, [uniqueColors, selectedColorId]);

  useEffect(() => {
    if (sizesForSelectedColor.length > 0 && !selectedSizeId) {
      setSelectedSizeId(sizesForSelectedColor[0].id);
    }
  }, [sizesForSelectedColor, selectedSizeId]);

  const handleColorSelect = (colorId: string) => {
    setSelectedColorId(colorId);
    setSelectedSizeId('');
    setActiveImgIndex(0);
  };

  const currentVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return (
      variants.find((v) => v.color_id === selectedColorId && v.size_id === selectedSizeId) ||
      variants.find((v) => v.color_id === selectedColorId) ||
      variants[0]
    );
  }, [variants, selectedColorId, selectedSizeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-[#5A7469] gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading product…</span>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif-title text-2xl font-bold text-[#0B241C]">Product Not Found</h2>
        <p className="text-sm text-[#2C4A3E]">
          The product you are looking for might have been moved or removed from our catalog.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  const { product, category, subcategory, features } = data;
  const hasVariants = Boolean(product.has_variants);

  const galleryImages = hasVariants
    ? currentVariant?.images && currentVariant.images.length > 0
      ? currentVariant.images
      : []
    : data.images.length > 0
      ? data.images
      : [];

  const rawPrice = hasVariants ? currentVariant?.price : product.price;
  const rawSellingPrice = hasVariants ? currentVariant?.selling_price : product.selling_price;

  // Some rows have price/selling_price entered the "wrong way round" —
  // MRP should always be the higher number, so normalize regardless of
  // which field it actually landed in.
  let displayOriginalPrice = rawPrice;
  let displaySellingPrice = rawSellingPrice;
  if (rawPrice != null && rawSellingPrice != null && rawSellingPrice > rawPrice) {
    displayOriginalPrice = rawSellingPrice;
    displaySellingPrice = rawPrice;
  }

  const showStrike =
    displayOriginalPrice != null &&
    displaySellingPrice != null &&
    displayOriginalPrice > displaySellingPrice;
  const discount = showStrike
    ? Math.round(
      (((displayOriginalPrice as number) - (displaySellingPrice as number)) /
        (displayOriginalPrice as number)) *
      100
    )
    : 0;

  const displayStock = hasVariants ? currentVariant?.stock ?? 0 : product.stock ?? 0;
  const inStock = displayStock > 0;

  const isWished = isInWishlist(product.id);

  // Shape the data the way StoreContext's cart/wishlist actions expect,
  // reflecting whichever variant is currently selected.
  const cartProduct = {
    id: product.id,
    name: product.name,
    price: (displaySellingPrice ?? displayOriginalPrice ?? 0),
    originalPrice: showStrike ? displayOriginalPrice ?? undefined : undefined,
    image: galleryImages[0] || '',
    images: galleryImages,
    category: category?.title || '',
    categorySlug: category?.slug || '',
    subcategory: subcategory?.name || '',
    stock: displayStock,
    status: ((product as any).status || 'Published') as any,
    sku: (hasVariants ? currentVariant?.sku : product.sku) || '',
    description: product.description || '',
  };

  const activeVariantLabels: Record<string, string> = {};
  if (hasVariants && currentVariant?.color) activeVariantLabels['Color'] = currentVariant.color.name;
  if (hasVariants && currentVariant?.size) activeVariantLabels['Size'] = currentVariant.size.name;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(cartProduct, quantity, activeVariantLabels);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    if (!user?.email) {
      openAuthModal({
        actionType: 'order',
        title: 'Sign In to Place Order 💎',
        message: 'Please sign in to your Purnya Circle account to complete this order and finalize delivery.',
        redirectUrl: '/checkout',
      });
      return;
    }
    addToCart(cartProduct, quantity, activeVariantLabels);
    router.push('/checkout');
  };

  const handleSubmitReview = async () => {
    if (!user?.id) {
      openAuthModal({
        actionType: 'review',
        title: 'Sign In to Write a Review 💎',
        message: 'Please sign in to your Purnya Circle account to share your experience with this creation.',
        redirectUrl: `/product/${product.id}`,
      });
      return;
    }

    setSubmittingReview(true);
    setReviewError('');

    const { data: savedReview, error } = await supabase
      .from('product_reviews')
      .upsert(
        {
          product_id: product.id,
          user_id: user.id,
          // Adjust to whatever field your `user` object actually exposes.
          user_name: (user as any).name || user.email || 'Purnya Customer',
          rating: newRating,
          comment: newComment.trim() || null,
        },
        { onConflict: 'product_id,user_id' }
      )
      .select()
      .single();

    setSubmittingReview(false);

    if (error || !savedReview) {
      setReviewError('Something went wrong submitting your review. Please try again.');
      return;
    }

    const reviewsList = await fetchReviews(product.id);
    setReviews(reviewsList);
    setReviewStats(computeStats(reviewsList));
  };

  return (
    <div className="space-y-16 pb-20 pt-6">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-[#5A7469] uppercase tracking-wider">
          <Link href="/" className="hover:text-[#0C3B2E]">Home</Link>
          {category && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link
                href={`/category/${category.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0C3B2E] font-medium inline-flex items-center gap-1"
              >
                <span>{category.title}</span>
                <ArrowUpRight className="w-3 h-3 text-[#C5A059]" />
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0B241C] font-semibold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </div>
      </div>

      {/* Main PDP Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            {galleryImages.length > 0 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible shrink-0 pb-2 sm:pb-0">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all bg-[#EBF3EF] shrink-0 ${activeImgIndex === idx
                        ? 'border-[#0C3B2E] shadow-md scale-105 ring-1 ring-[#C5A059]'
                        : 'border-[#E2DBD0] hover:border-[#0C3B2E]/50'
                      }`}
                  >
                    <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Preview */}
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[#EBF3EF] border border-[#E2DBD0] shadow-xs group">
              {galleryImages[activeImgIndex] ? (
                <img
                  src={galleryImages[activeImgIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#5A7469]">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs font-semibold">No image available</span>
                </div>
              )}
              {product.is_featured && (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs uppercase font-bold tracking-wider rounded-md bg-[#0C3B2E] text-white shadow-xs">
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Details & Purchasing */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-1">
                {[category?.title, subcategory?.name].filter(Boolean).join(' · ')}
              </p>
              <h1 className="font-serif-title text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B241C] leading-snug">
                {product.name}
              </h1>

              <button
                onClick={() => setActiveTab('reviews')}
                className="flex items-center gap-2 mt-2.5"
              >
                <StarRating rating={reviewStats.average_rating} size={16} />
                <span className="text-xs font-semibold text-[#5A7469] hover:text-[#0C3B2E] hover:underline">
                  {reviewStats.review_count > 0
                    ? `${reviewStats.average_rating.toFixed(1)} · ${reviewStats.review_count} review${reviewStats.review_count === 1 ? '' : 's'}`
                    : 'Purnya quality assured'}
                </span>
              </button>
            </div>
            {/* Price Row */}
            <div className="border-y border-[#E2DBD0] py-4 space-y-2">
              <div className="flex flex-col gap-1">
                {showStrike && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469]">M.R.P:</span>
                    <span className="text-sm font-semibold text-[#5A7469] line-through">
                      ₹{(displayOriginalPrice as number).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-3">
                  <span className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
                    ₹{(displaySellingPrice ?? displayOriginalPrice ?? 0).toLocaleString('en-IN')}
                  </span>
                  {showStrike && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#C5A059] text-[#08281F]">
                      {discount}% OFF
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-[#5A7469]">Inclusive of all taxes · Free express shipping above ₹999</p>
            </div>

            {/* Color Selector */}
            {hasVariants && uniqueColors.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-[#2C4A3E]">Select Color:</span>
                  <span className="font-bold text-[#0B241C]">
                    {uniqueColors.find((c) => c.id === selectedColorId)?.name || ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map((color) => {
                    const isSelected = selectedColorId === color.id;
                    return (
                      <button
                        key={color.id}
                        onClick={() => handleColorSelect(color.id)}
                        title={color.name}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${isSelected
                            ? 'border-[#0C3B2E] ring-2 ring-[#C5A059] ring-offset-2 scale-105'
                            : 'border-[#E2DBD0] hover:border-[#0C3B2E]/50'
                          }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {hasVariants && sizesForSelectedColor.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-[#2C4A3E]">Select Size:</span>
                  <span className="font-bold text-[#0B241C]">
                    {sizesForSelectedColor.find((s) => s.id === selectedSizeId)?.name || ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesForSelectedColor.map((size) => {
                    const isSelected = selectedSizeId === size.id;
                    return (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSizeId(size.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${isSelected
                            ? 'bg-[#0C3B2E] text-white shadow-sm ring-2 ring-[#C5A059]'
                            : 'bg-[#FAF8F5] text-[#2C4A3E] hover:bg-[#EBF3EF] border border-[#E2DBD0]'
                          }`}
                      >
                        {size.name}
                        {size.dimension ? ` · ${size.dimension}` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2C4A3E]">
                Quantity:
              </span>
              <div className="flex items-center border border-[#E2DBD0] rounded-xl bg-white shadow-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E]"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-bold text-[#0B241C]">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E]"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => toggleWishlist(cartProduct)}
                  aria-label="Add to Wishlist"
                  className={`w-13 h-13 rounded-xl border flex items-center justify-center transition-all ${isWished
                      ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-xs'
                      : 'bg-white border-[#E2DBD0] text-[#2C4A3E] hover:border-[#0C3B2E] hover:text-rose-600'
                    }`}
                >
                  <Heart className={`w-5 h-5 ${isWished ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0C3B2E] hover:bg-[#134E3E] text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                Buy It Now
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="bg-[#EBF3EF]/60 p-4 rounded-2xl border border-[#E2DBD0] space-y-2 text-xs text-[#2C4A3E]">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#0C3B2E] shrink-0" />
                <span>Express courier delivery within 3 to 5 business days</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-[#0C3B2E] shrink-0" />
                <span>Hassle-free 7-day return and exchange policy</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0C3B2E] shrink-0" />
                <span>100% authentic artisanal craftsmanship guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E2DBD0] p-6 sm:p-10 shadow-xs">
          <div className="flex border-b border-[#E2DBD0] overflow-x-auto gap-4 sm:gap-8 pb-3 scrollbar-none">
            {[
              { id: 'desc', label: 'Product Description' },
              { id: 'specs', label: 'Specifications' },
              { id: 'care', label: 'Features' },
              { id: 'reviews', label: `Reviews${reviewStats.review_count > 0 ? ` (${reviewStats.review_count})` : ''}` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`font-serif-title text-base sm:text-lg font-bold pb-2 relative transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? 'text-[#0C3B2E]'
                    : 'text-[#5A7469] hover:text-[#0C3B2E]'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0C3B2E] rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-6 text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
            {activeTab === 'desc' && (
              <div className="space-y-4">
                <p>
                  {product.description ||
                    `Crafted with immaculate dedication and attention to detail, this ${product.name.toLowerCase()} represents the core ethos of Purnya. Inspired by timeless aesthetics and modern simplicity, each piece undergoes rigorous quality checks before reaching your sanctuary.`}
                </p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-2xl">
                <div className="divide-y divide-[#EFEBE3] border border-[#E2DBD0] rounded-2xl overflow-hidden bg-[#FAF8F5]/60">
                  <div className="grid grid-cols-3 p-3.5 text-xs">
                    <span className="font-semibold text-[#5A7469]">Category</span>
                    <span className="col-span-2 font-medium text-[#0B241C]">{category?.title || '—'}</span>
                  </div>
                  {subcategory && (
                    <div className="grid grid-cols-3 p-3.5 text-xs">
                      <span className="font-semibold text-[#5A7469]">Subcategory</span>
                      <span className="col-span-2 font-medium text-[#0B241C]">{subcategory.name}</span>
                    </div>
                  )}
                  {hasVariants && currentVariant?.color && (
                    <div className="grid grid-cols-3 p-3.5 text-xs">
                      <span className="font-semibold text-[#5A7469]">Color</span>
                      <span className="col-span-2 font-medium text-[#0B241C]">{currentVariant.color.name}</span>
                    </div>
                  )}
                  {hasVariants && currentVariant?.size && (
                    <div className="grid grid-cols-3 p-3.5 text-xs">
                      <span className="font-semibold text-[#5A7469]">Size</span>
                      <span className="col-span-2 font-medium text-[#0B241C]">
                        {currentVariant.size.name}
                        {currentVariant.size.dimension ? ` (${currentVariant.size.dimension})` : ''}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 p-3.5 text-xs">
                    <span className="font-semibold text-[#5A7469]">Origin</span>
                    <span className="col-span-2 font-medium text-[#0B241C]">India (Artisanal Made)</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'care' && (
              <div className="max-w-2xl space-y-3">
                <div className="space-y-4 max-w-3xl">
                  {features.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                      {features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#0C3B2E] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8 max-w-3xl">
                {/* Summary */}
                <div className="flex items-center gap-5 p-5 rounded-2xl border border-[#E2DBD0] bg-[#FAF8F5]/60">
                  <div className="text-center shrink-0">
                    <p className="font-serif-title text-3xl font-bold text-[#0B241C]">
                      {reviewStats.average_rating.toFixed(1)}
                    </p>
                    <StarRating rating={reviewStats.average_rating} size={14} />
                  </div>
                  <div className="text-xs text-[#5A7469]">
                    {reviewStats.review_count > 0
                      ? `Based on ${reviewStats.review_count} verified review${reviewStats.review_count === 1 ? '' : 's'}`
                      : 'No reviews yet — every patron receives a review invite after delivery.'}
                  </div>
                </div>

                {/* Write / edit a review */}
                <div className="p-5 rounded-2xl border border-[#E2DBD0] bg-white space-y-3">
                  <h3 className="font-serif-title text-base font-bold text-[#0B241C]">
                    {hasReviewed ? 'Update Your Review' : 'Write a Review'}
                  </h3>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#2C4A3E]">
                      Your Rating:
                    </span>
                    <StarRating rating={newRating} size={20} interactive onChange={setNewRating} />
                  </div>

                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience with this creation…"
                    rows={3}
                    className="w-full rounded-xl border border-[#E2DBD0] p-3 text-xs text-[#2C4A3E] focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FAF8F5]/40"
                  />

                  {reviewError && <p className="text-xs text-rose-600">{reviewError}</p>}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="px-6 py-2.5 rounded-xl bg-[#0C3B2E] hover:bg-[#134E3E] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? 'Submitting…' : hasReviewed ? 'Update Review' : 'Submit Review'}
                    </button>
                    {!user?.email && (
                      <p className="text-[11px] text-[#5A7469]">You'll be asked to sign in first.</p>
                    )}
                  </div>
                </div>

                {/* Review list */}
                {reviews.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-[#E2DBD0] bg-[#FAF8F5]/60 text-center space-y-2">
                    <p className="text-xs font-semibold text-[#0B241C]">No reviews yet.</p>
                    <p className="text-[11px] text-[#5A7469] max-w-md mx-auto">
                      Be the first to share your experience with this creation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="p-4 rounded-2xl border border-[#E2DBD0] bg-white space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-[#0B241C]">
                            {r.user_name || 'Purnya Customer'}
                          </span>
                          <span className="text-[10px] text-[#5A7469] shrink-0">
                            {new Date(r.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <StarRating rating={r.rating} size={13} />
                        {r.comment && (
                          <p className="text-xs text-[#2C4A3E] leading-relaxed pt-1">{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              Recommended For You
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C] mt-1">
              You May Also Adore
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="group block rounded-3xl overflow-hidden border border-[#E2DBD0] bg-white hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-[#EBF3EF] overflow-hidden flex items-center justify-center">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#5A7469]" />
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-xs font-semibold text-[#0B241C] truncate">{p.name}</p>
                  <p className="text-xs font-bold text-[#0C3B2E]">
                    ₹{(p.selling_price ?? p.price ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}