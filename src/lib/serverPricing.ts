// lib/serverPricing.ts
// Recomputes a cart's total from the database so the browser can't choose the price.
// Server-only: used by /api/razorpay/create-order.

import { getCatalogSupabase } from './supabaseServer';
import { mapCouponRow } from './supabase';
import {
  getCouponDiscount,
  getCouponProblem,
  getOrderTotal,
  getShippingFee,
} from './pricing';

const MAX_QTY_PER_LINE = 100;

export interface CartLineInput {
  productId: string;
  quantity: number;
  variant?: Record<string, string>;
}

export interface PricedLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variant?: Record<string, string>;
}

export interface PricedCart {
  /** Unit price per product id, as the server will charge it. */
  unitPrices: Record<string, number>;
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  /** Set when the requested coupon can't be applied; the total then excludes it. */
  couponError?: string;
}

/** A problem the customer can fix (bad cart contents), as opposed to a server failure. */
export class PricingError extends Error {}

function lowestPositive(...values: unknown[]): number | null {
  const prices = values
    .map((v) => (v == null ? NaN : Number(v)))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}

function sameLabel(a: string | undefined, b: string | undefined) {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
}

function parseLines(raw: unknown): CartLineInput[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new PricingError('Your bag is empty.');
  }
  return raw.map((line: any) => {
    const quantity = Number(line?.quantity);
    if (typeof line?.productId !== 'string' || !line.productId) {
      throw new PricingError('Your bag contains an invalid item.');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
      throw new PricingError(`Quantity must be between 1 and ${MAX_QTY_PER_LINE}.`);
    }
    // Variant labels end up on the saved order, so keep only short text pairs.
    const variantEntries =
      line.variant && typeof line.variant === 'object'
        ? Object.entries(line.variant)
            .filter(([k, v]) => typeof v === 'string' && k.length <= 40 && (v as string).length <= 80)
            .slice(0, 5)
        : [];
    const variant = variantEntries.length > 0 ? (Object.fromEntries(variantEntries) as Record<string, string>) : undefined;
    return { productId: line.productId, quantity, variant };
  });
}

export async function priceCart(rawLines: unknown, couponCode: unknown): Promise<PricedCart> {
  const lines = parseLines(rawLines);
  const db = getCatalogSupabase();
  const productIds = Array.from(new Set(lines.map((l) => l.productId)));

  const [productsRes, variantsRes] = await Promise.all([
    db.from('products').select('*').in('id', productIds),
    db
      .from('product_variants')
      .select('id,product_id,color_id,size_id,price,selling_price')
      .in('product_id', productIds)
      .eq('is_active', true),
  ]);
  // 22P02: an id that isn't a valid uuid, e.g. a stale item from an old bag.
  if (productsRes.error?.code === '22P02' || variantsRes.error?.code === '22P02') {
    throw new PricingError('An item in your bag is no longer available. Please remove it and try again.');
  }
  if (productsRes.error) throw new Error(`Could not load products: ${productsRes.error.message}`);
  if (variantsRes.error) throw new Error(`Could not load variants: ${variantsRes.error.message}`);

  const variants = variantsRes.data || [];
  const colorIds = Array.from(new Set(variants.map((v: any) => v.color_id).filter(Boolean)));
  const sizeIds = Array.from(new Set(variants.map((v: any) => v.size_id).filter(Boolean)));
  const [colorsRes, sizesRes] = await Promise.all([
    colorIds.length > 0
      ? db.from('color_palettes').select('id,name').in('id', colorIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    sizeIds.length > 0
      ? db.from('size_variants').select('id,name').in('id', sizeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
  ]);
  if (colorsRes.error) throw new Error(`Could not load colours: ${colorsRes.error.message}`);
  if (sizesRes.error) throw new Error(`Could not load sizes: ${sizesRes.error.message}`);

  const productsById = new Map((productsRes.data || []).map((p: any) => [p.id, p]));
  const colorNames = new Map((colorsRes.data || []).map((c) => [c.id, c.name]));
  const sizeNames = new Map((sizesRes.data || []).map((s) => [s.id, s.name]));

  const unitPrices: Record<string, number> = {};
  const pricedLines: PricedLine[] = [];
  let subtotal = 0;

  for (const line of lines) {
    const product: any = productsById.get(line.productId);
    if (!product || product.is_active === false) {
      throw new PricingError(
        `${product?.name ? `"${product.name}"` : 'An item in your bag'} is no longer available. Please remove it and try again.`
      );
    }

    // Same rule as the product page: the lower of price / selling_price, taken
    // from the selected colour/size variant when the product has variants.
    let unitPrice: number | null = null;
    const productVariants = product.has_variants
      ? variants.filter((v: any) => v.product_id === product.id)
      : [];
    if (productVariants.length > 0) {
      const wantColor = line.variant?.Color;
      const wantSize = line.variant?.Size;
      const matching = productVariants.filter(
        (v: any) =>
          (wantColor === undefined || sameLabel(colorNames.get(v.color_id), wantColor)) &&
          (wantSize === undefined || sameLabel(sizeNames.get(v.size_id), wantSize))
      );
      const candidates = matching.length > 0 ? matching : productVariants;
      unitPrice = lowestPositive(...candidates.map((v: any) => lowestPositive(v.price, v.selling_price)));
    }
    if (unitPrice === null) {
      unitPrice = lowestPositive(product.price, product.selling_price ?? product.offer_price);
    }
    if (unitPrice === null) {
      throw new PricingError(`"${product.name || 'An item'}" can't be purchased right now. Please remove it and try again.`);
    }

    unitPrices[line.productId] = unitPrice;
    pricedLines.push({
      productId: line.productId,
      name: product.name || product.title || 'Product',
      unitPrice,
      quantity: line.quantity,
      variant: line.variant,
    });
    subtotal += unitPrice * line.quantity;
  }

  let discount = 0;
  let couponError: string | undefined;
  const code = typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : '';
  if (code) {
    const { data: couponRow, error } = await db.from('coupons').select('*').eq('code', code).maybeSingle();
    if (error) throw new Error(`Could not load coupon: ${error.message}`);
    const coupon = couponRow ? mapCouponRow(couponRow) : null;
    couponError = coupon ? getCouponProblem(coupon, subtotal) ?? undefined : 'Invalid or inactive coupon code.';
    if (coupon && !couponError) discount = getCouponDiscount(coupon, subtotal);
  }

  const shipping = getShippingFee(subtotal, lines.length);
  return {
    unitPrices,
    lines: pricedLines,
    subtotal,
    discount,
    shipping,
    total: getOrderTotal(subtotal, discount, shipping),
    couponError,
  };
}
