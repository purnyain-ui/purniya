'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  hidePrice?: boolean;
  showVariants?: boolean;
}

export default function ProductCard({
  product,
  compact = false,
  hidePrice = false,
  showVariants = true,
}: ProductCardProps) {
  const router = useRouter();
  const { toggleWishlist, isInWishlist, addToCart } = useStore();
  const isWished = isInWishlist(product.id);

  // Variant resolution:
  // "if it has only size it need to show if it as sizes then it need to show it perfectly without breaking it okay if both exists show only size in card okay"
  const sizeVariant = product.variants?.find((v) =>
    v.name.toLowerCase().includes('size') || v.name.toLowerCase() === 'sizes'
  );
  const otherVariant = product.variants?.find((v) => v.options && v.options.length > 0);
  const activeVariant = sizeVariant || otherVariant;

  const [selectedVariantOption, setSelectedVariantOption] = React.useState<string>(
    activeVariant?.options?.[0] || ''
  );

  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const allImages = React.useMemo(() => {
    if (product.images && product.images.length > 0) return product.images;
    return [product.image];
  }, [product.images, product.image]);

  const defaultImg = allImages[0];
  const secondImg = allImages.length > 1 ? allImages[1] : null;
  const displayImg = hoveredIdx !== null ? allImages[hoveredIdx] : defaultImg;

  React.useEffect(() => {
    if (activeVariant?.options?.[0]) {
      setSelectedVariantOption(activeVariant.options[0]);
    }
  }, [product.id, activeVariant]);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-[#E2DBD0] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:border-[#0C3B2E]/60 hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#EBF3EF]/40">
        <Link href={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={displayImg}
            alt={product.name}
            className={`w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${
              hoveredIdx === null && secondImg ? 'group-hover:opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.currentTarget;
              target.src = 'https://images.unsplash.com/photo-1515562141589-67f0d0953a8e?w=600&fit=crop&auto=format';
            }}
          />
          {hoveredIdx === null && secondImg && (
            <img
              src={secondImg}
              alt={product.name + ' alternate view'}
              className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out opacity-0 group-hover:opacity-100 group-hover:scale-105 pointer-events-none"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
          {product.badge && (
            <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md shadow-xs bg-[#0C3B2E] text-white">
              {product.badge}
            </span>
          )}
          {discount > 0 && !hidePrice && (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md shadow-xs bg-[#C5A059] text-[#08281F]">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Top Right Action Icons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            aria-label="Wishlist"
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
              isWished
                ? 'bg-rose-50 text-rose-600 shadow-md scale-105'
                : 'bg-white/85 text-[#2C4A3E] hover:bg-white hover:text-rose-600 hover:scale-105 shadow-xs'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform ${isWished ? 'fill-current' : ''}`} />
          </button>

          {/* Add to Cart Icon Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(
                product,
                1,
                activeVariant && selectedVariantOption
                  ? { [activeVariant.name]: selectedVariantOption }
                  : undefined
              );
            }}
            aria-label="Add to Cart"
            className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer bg-white/85 text-[#2C4A3E] hover:bg-[#0C3B2E] hover:text-white hover:scale-105 shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnails overlay on hover */}
        {allImages.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            {allImages.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all transform hover:scale-110 shadow-lg cursor-pointer ${
                  hoveredIdx === idx ? 'border-[#C5A059] scale-110' : 'border-white/70 hover:border-white'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className={`p-4 flex flex-col flex-1 ${compact ? 'p-3' : 'p-4'}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C5A059] mb-1">
          {product.subcategory}
        </p>

        <Link
          href={`/product/${product.id}`}
          className="text-xs sm:text-sm font-semibold text-[#0B241C] hover:text-[#0C3B2E] transition-colors line-clamp-1 mb-1.5"
        >
          {product.name}
        </Link>

        {/* Variant / Size Options display (omitted on home page or compact) */}
        {showVariants && !compact && activeVariant && activeVariant.options && activeVariant.options.length > 0 && (
          <div className="my-1.5 pt-1.5 border-t border-[#F0ECE1]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">
                {activeVariant.name}:
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {activeVariant.options.slice(0, 4).map((option, idx) => {
                  const isSelected = selectedVariantOption === option;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedVariantOption(option);
                      }}
                      className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-all border cursor-pointer leading-tight ${
                        isSelected
                          ? 'bg-[#0C3B2E] text-white border-[#0C3B2E] shadow-2xs'
                          : 'bg-[#FAF8F5] text-[#2C4A3E] border-[#E2DBD0] hover:border-[#0C3B2E] hover:bg-white'
                      }`}
                      title={`${activeVariant.name}: ${option}`}
                    >
                      {option}
                    </button>
                  );
                })}
                {activeVariant.options.length > 4 && (
                  <Link
                    href={`/product/${product.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-semibold text-[#C5A059] hover:underline whitespace-nowrap"
                  >
                    +{activeVariant.options.length - 4} more
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {!hidePrice && (
          <div className="mt-auto flex items-baseline gap-2 pt-1 border-t border-[#EFEBE3]">
            <span className="text-sm sm:text-base font-bold text-[#0B241C]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-[#5A7469] line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
