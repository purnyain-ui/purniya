'use client';

import React, { useState, useMemo, use } from 'react';
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
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import ProductCard from '../../../components/ProductCard';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const { products, addToCart, toggleWishlist, isInWishlist } = useStore();

  const product = useMemo(() => {
    return products.find((p) => p.id === id);
  }, [products, id]);

  const [quantity, setQuantity] = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'care' | 'reviews'>('desc');

  // Initialize default variants
  React.useEffect(() => {
    if (product?.variants) {
      const defaults: Record<string, string> = {};
      product.variants.forEach((v) => {
        if (v.options.length > 0) {
          defaults[v.name] = v.options[0];
        }
      });
      setSelectedVariants(defaults);
    }
  }, [product]);

  if (!product) {
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

  const galleryImages = product.images && product.images.length > 0
    ? product.images
    : [product.image, product.image, product.image];

  const isWished = isInWishlist(product.id);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariants);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariants);
    router.push('/checkout');
  };

  const relatedProducts = products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="space-y-16 pb-20 pt-6">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-[#5A7469] uppercase tracking-wider">
          <Link href="/" className="hover:text-[#0C3B2E]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={`/category/${product.categorySlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0C3B2E] font-medium inline-flex items-center gap-1"
          >
            <span>{product.category}</span>
            <ArrowUpRight className="w-3 h-3 text-[#C5A059]" />
          </Link>
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
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible shrink-0 pb-2 sm:pb-0">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all bg-[#EBF3EF] shrink-0 ${
                    activeImgIndex === idx
                      ? 'border-[#0C3B2E] shadow-md scale-105 ring-1 ring-[#C5A059]'
                      : 'border-[#E2DBD0] hover:border-[#0C3B2E]/50'
                  }`}
                >
                  <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Preview */}
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[#EBF3EF] border border-[#E2DBD0] shadow-xs group">
              <img
                src={galleryImages[activeImgIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs uppercase font-bold tracking-wider rounded-md bg-[#0C3B2E] text-white shadow-xs">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Details & Purchasing */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-1">
                {product.category} · {product.subcategory}
              </p>
              <h1 className="font-serif-title text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B241C] leading-snug">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex text-[#C5A059]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#0B241C]">{product.rating || 4.9}</span>
                <span className="text-xs text-[#5A7469]">
                  ({product.reviewsCount || 34} customer reviews)
                </span>
              </div>
            </div>

            {/* Price Row */}
            <div className="border-y border-[#E2DBD0] py-4 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-base text-[#5A7469] line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#C5A059] text-[#08281F]">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-[#5A7469]">Inclusive of all taxes · Free express shipping above ₹999</p>
            </div>

            {/* Stock Availability */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-semibold text-emerald-900">
                In Stock ({product.stock} units available for immediate dispatch)
              </span>
            </div>

            {/* Category Specific Variants (SOW Section 9) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 pt-1">
                {product.variants.map((v) => (
                  <div key={v.name} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold uppercase tracking-wider text-[#2C4A3E]">
                        Select {v.name}:
                      </span>
                      <span className="font-bold text-[#0B241C]">{selectedVariants[v.name]}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((opt) => {
                        const isSelected = selectedVariants[v.name] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => setSelectedVariants({ ...selectedVariants, [v.name]: opt })}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-[#0C3B2E] text-white shadow-sm ring-2 ring-[#C5A059]'
                                : 'bg-[#FAF8F5] text-[#2C4A3E] hover:bg-[#EBF3EF] border border-[#E2DBD0]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  aria-label="Add to Wishlist"
                  className={`w-13 h-13 rounded-xl border flex items-center justify-center transition-all ${
                    isWished
                      ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-xs'
                      : 'bg-white border-[#E2DBD0] text-[#2C4A3E] hover:border-[#0C3B2E] hover:text-rose-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWished ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0C3B2E] hover:bg-[#134E3E] text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all hover:scale-[1.01]"
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
              { id: 'care', label: 'Care & Usage' },
              { id: 'reviews', label: `Reviews (${product.reviewsCount || 34})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`font-serif-title text-base sm:text-lg font-bold pb-2 relative transition-colors whitespace-nowrap ${
                  activeTab === tab.id
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
              <div className="space-y-4 max-w-3xl">
                <p>
                  {product.description ||
                    `Crafted with immaculate dedication and attention to detail, this ${product.name.toLowerCase()} represents the core ethos of Purnya. Inspired by timeless aesthetics and modern simplicity, each piece undergoes rigorous quality checks before reaching your sanctuary.`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0C3B2E] shrink-0 mt-0.5" />
                    <span>Consciously handcrafted by skilled master artisans</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0C3B2E] shrink-0 mt-0.5" />
                    <span>Delivered in Purnya signature luxury presentation packaging</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-2xl">
                <div className="divide-y divide-[#EFEBE3] border border-[#E2DBD0] rounded-2xl overflow-hidden bg-[#FAF8F5]/60">
                  {product.specifications ? (
                    Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-3 p-3.5 text-xs">
                        <span className="font-semibold text-[#5A7469]">{key}</span>
                        <span className="col-span-2 font-medium text-[#0B241C]">{val}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="grid grid-cols-3 p-3.5 text-xs">
                        <span className="font-semibold text-[#5A7469]">Category</span>
                        <span className="col-span-2 font-medium text-[#0B241C]">{product.category}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3.5 text-xs">
                        <span className="font-semibold text-[#5A7469]">Subcategory</span>
                        <span className="col-span-2 font-medium text-[#0B241C]">{product.subcategory}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3.5 text-xs">
                        <span className="font-semibold text-[#5A7469]">Origin</span>
                        <span className="col-span-2 font-medium text-[#0B241C]">India (Artisanal Made)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'care' && (
              <div className="max-w-2xl space-y-3">
                <p className="font-semibold text-[#0B241C]">To preserve the longevity of your purchase:</p>
                <ul className="space-y-2 list-disc list-inside text-[#2C4A3E]">
                  {product.careInstructions ? (
                    product.careInstructions.map((inst, i) => <li key={i}>{inst}</li>)
                  ) : (
                    <>
                      <li>Store in the original packaging or a dry protective pouch.</li>
                      <li>Avoid direct exposure to harsh perfumes, chemicals, and extreme humidity.</li>
                      <li>Clean gently with a soft micro-fiber cloth after each use.</li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 max-w-3xl">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#EBF3EF] border border-[#E2DBD0]">
                  <div className="text-center pr-6 border-r border-[#E2DBD0]">
                    <p className="font-serif-title text-3xl font-bold text-[#0B241C]">{product.rating || 4.9}</p>
                    <div className="flex text-[#C5A059] justify-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0B241C]">100% of patrons recommend this creation</p>
                    <p className="text-[11px] text-[#5A7469]">Based on verified purchases across Purnya.in</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-[#E2DBD0] bg-[#FAF8F5]/60 text-center space-y-3">
                  <p className="text-xs font-semibold text-[#0B241C]">
                    Customer reviews for this creation are collected post-delivery.
                  </p>
                  <p className="text-[11px] text-[#5A7469] max-w-md mx-auto">
                    Every patron receives a verified review invitation link upon order fulfillment to ensure 100% authentic feedback.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
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
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
