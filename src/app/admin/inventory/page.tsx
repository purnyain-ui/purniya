'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ImageOff,
  Minus,
  Plus,
  Loader2,
} from 'lucide-react'

import { supabase } from '@/lib/supabaseClient'

// ---------------------------------------------------------------
// Design tokens (shared with the rest of the admin panel)
//   ink    #0B241C  -> headings, primary surfaces
//   gold   #C5A059  -> accents
//   paper  #FAF8F5  -> input / row backgrounds
//   line   #E2DBD0  -> borders
//   sage   #5A7469  -> secondary / muted text
//
// Stock status gets its own small palette, pulled from hexes already
// used in this boutique's color_palettes seed data so it doesn't feel
// like a bolted-on generic red/amber/green:
//   inStock  #2F6F4E  (deep forest green)
//   low      #C97C2C  (saffron clay)
//   out      #8B1E2F  (ruby crimson — same as "Ruby Crimson" swatch)
// ---------------------------------------------------------------

const LOW_STOCK_THRESHOLD = 5

type Category = {
  id: string
  title: string
}

type Subcategory = {
  id: string
  category_id: string
  name: string
}

type ProductImageRow = {
  product_id: string
  image_url: string
  sort_order: number
}

type VariantImageRow = {
  variant_id: string
  image_url: string
  sort_order: number
}

type ColorRef = {
  id: string
  name: string
  hex: string
}

type SizeRef = {
  id: string
  name: string
  dimension: string
}

type VariantRecord = {
  id: string
  product_id: string
  color_id: string | null
  size_id: string | null
  sku: string
  price: number
  selling_price: number
  stock: number
  is_active: boolean
}

type ProductRecord = {
  id: string
  name: string
  sku: string
  category_id: string
  subcategory_id: string | null
  price: number | null
  selling_price: number | null
  stock: number
  has_variants: boolean
  is_active: boolean
}

type AssembledVariant = {
  id: string
  label: string
  sku: string
  price: number
  selling_price: number
  stock: number
  colorHex: string | null
  thumbnail: string | null
}

type AssembledProduct = {
  id: string
  name: string
  sku: string
  categoryTitle: string
  subcategoryName: string | null
  hasVariants: boolean
  isActive: boolean
  thumbnail: string | null
  price: number | null
  sellingPrice: number | null
  stock: number
  variants: AssembledVariant[]
}

type StockFilter = 'all' | 'in' | 'low' | 'out'

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return {
      key: 'out' as const,
      label: 'Out of stock',
      color: '#8B1E2F',
      bg: '#8B1E2F14',
      icon: XCircle,
    }
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      key: 'low' as const,
      label: 'Low stock',
      color: '#C97C2C',
      bg: '#C97C2C14',
      icon: AlertTriangle,
    }
  }
  return {
    key: 'in' as const,
    label: 'In stock',
    color: '#2F6F4E',
    bg: '#2F6F4E14',
    icon: CheckCircle2,
  }
}

function StockBadge({ stock }: { stock: number }) {
  const status = getStockStatus(stock)
  const Icon = status.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0"
      style={{ color: status.color, backgroundColor: status.bg }}
    >
      <Icon className="w-3 h-3" />
      {status.label}
    </span>
  )
}

// Same visual language as StockBadge, but editable: a -/qty/+ control
// that writes straight to Supabase on blur, Enter, or +/- click. Every
// click handler stops propagation so it works safely nested inside a
// clickable row (expand/collapse) without triggering that row's click.
function StockControl({
  stock,
  saving,
  onChange,
  compact = false,
}: {
  stock: number
  saving: boolean
  onChange: (nextStock: number) => void
  compact?: boolean
}) {
  const status = getStockStatus(stock)
  const Icon = status.icon
  const [local, setLocal] = useState(String(stock))

  useEffect(() => {
    setLocal(String(stock))
  }, [stock])

  const commit = (raw: string) => {
    const parsed = Math.max(0, Math.round(Number(raw)))
    if (!Number.isFinite(parsed)) {
      setLocal(String(stock))
      return
    }
    setLocal(String(parsed))
    if (parsed !== stock) onChange(parsed)
  }

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex items-center gap-0.5 pl-1 pr-2 rounded-full shrink-0 ${
        compact ? 'py-0.5' : 'py-1'
      }`}
      style={{ backgroundColor: status.bg }}
    >
      <button
        type="button"
        onClick={() => commit(String(Math.max(0, stock - 1)))}
        disabled={saving || stock <= 0}
        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/5 disabled:opacity-30 cursor-pointer"
        style={{ color: status.color }}
      >
        <Minus className="w-3 h-3" />
      </button>

      <input
        value={local}
        onChange={(event) => setLocal(event.target.value.replace(/[^0-9]/g, ''))}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
        disabled={saving}
        className="w-7 bg-transparent text-center text-[11px] font-bold focus:outline-none disabled:opacity-60"
        style={{ color: status.color }}
      />

      <button
        type="button"
        onClick={() => commit(String(stock + 1))}
        disabled={saving}
        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/5 disabled:opacity-30 cursor-pointer"
        style={{ color: status.color }}
      >
        <Plus className="w-3 h-3" />
      </button>

      {saving ? (
        <Loader2 className="w-3 h-3 animate-spin ml-0.5" style={{ color: status.color }} />
      ) : (
        <Icon className="w-3 h-3 ml-0.5" style={{ color: status.color }} />
      )}
    </div>
  )
}

function Thumbnail({ url, size = 48 }: { url: string | null; size?: number }) {
  if (!url) {
    return (
      <div
        className="rounded-xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <ImageOff className="w-4 h-4 text-[#5A7469]" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      className="rounded-xl object-cover border border-[#E2DBD0] shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—'
  return `₹${value.toLocaleString('en-IN')}`
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div className="bg-[#0B241C] rounded-2xl px-5 py-4 flex-1 min-w-[140px]">
      <p className="text-[11px] text-white/50 font-semibold mb-1.5">{label}</p>
      <p
        className="font-serif-title text-2xl font-bold"
        style={{ color: accent || '#FFFFFF' }}
      >
        {value}
      </p>
    </div>
  )
}

export default function AdminInventoryPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<AssembledProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)

      const [
        categoriesResponse,
        subcategoriesResponse,
        productsResponse,
        variantsResponse,
        colorsResponse,
        sizesResponse,
        productImagesResponse,
        variantImagesResponse,
      ] = await Promise.all([
        supabase.from('categories').select('id,title'),
        supabase.from('subcategories').select('id,category_id,name'),
        supabase
          .from('products')
          .select(
            'id,name,sku,category_id,subcategory_id,price,selling_price,stock,has_variants,is_active'
          )
          .order('name'),
        supabase
          .from('product_variants')
          .select(
            'id,product_id,color_id,size_id,sku,price,selling_price,stock,is_active'
          ),
        supabase.from('color_palettes').select('id,name,hex'),
        supabase.from('size_variants').select('id,name,dimension'),
        supabase
          .from('product_images')
          .select('product_id,image_url,sort_order')
          .order('sort_order'),
        supabase
          .from('product_variant_images')
          .select('variant_id,image_url,sort_order')
          .order('sort_order'),
      ])

      const firstError = [
        categoriesResponse,
        subcategoriesResponse,
        productsResponse,
        variantsResponse,
        colorsResponse,
        sizesResponse,
        productImagesResponse,
        variantImagesResponse,
      ].find((response) => response.error)?.error

      if (firstError) throw firstError

      const categoryRows = (categoriesResponse.data || []) as Category[]
      const subcategoryRows = (subcategoriesResponse.data || []) as Subcategory[]
      const productRows = (productsResponse.data || []) as ProductRecord[]
      const variantRows = (variantsResponse.data || []) as VariantRecord[]
      const colorRows = (colorsResponse.data || []) as ColorRef[]
      const sizeRows = (sizesResponse.data || []) as SizeRef[]
      const productImageRows = (productImagesResponse.data || []) as ProductImageRow[]
      const variantImageRows = (variantImagesResponse.data || []) as VariantImageRow[]

      const categoryById = new Map(categoryRows.map((row) => [row.id, row]))
      const subcategoryById = new Map(subcategoryRows.map((row) => [row.id, row]))
      const colorById = new Map(colorRows.map((row) => [row.id, row]))
      const sizeById = new Map(sizeRows.map((row) => [row.id, row]))

      const firstProductImage = new Map<string, string>()
      for (const image of productImageRows) {
        if (!firstProductImage.has(image.product_id)) {
          firstProductImage.set(image.product_id, image.image_url)
        }
      }

      const firstVariantImage = new Map<string, string>()
      for (const image of variantImageRows) {
        if (!firstVariantImage.has(image.variant_id)) {
          firstVariantImage.set(image.variant_id, image.image_url)
        }
      }

      const variantsByProduct = new Map<string, VariantRecord[]>()
      for (const variant of variantRows) {
        const list = variantsByProduct.get(variant.product_id) || []
        list.push(variant)
        variantsByProduct.set(variant.product_id, list)
      }

      const assembled: AssembledProduct[] = productRows.map((product) => {
        const category = categoryById.get(product.category_id)
        const subcategory = product.subcategory_id
          ? subcategoryById.get(product.subcategory_id)
          : undefined

        const rawVariants = variantsByProduct.get(product.id) || []

        const variants: AssembledVariant[] = rawVariants.map((variant) => {
          const color = variant.color_id ? colorById.get(variant.color_id) : undefined
          const size = variant.size_id ? sizeById.get(variant.size_id) : undefined

          const labelParts = [color?.name, size?.name].filter(Boolean)

          return {
            id: variant.id,
            label: labelParts.length > 0 ? labelParts.join(' / ') : 'Variant',
            sku: variant.sku,
            price: variant.price,
            selling_price: variant.selling_price,
            stock: variant.stock,
            colorHex: color?.hex || null,
            thumbnail: firstVariantImage.get(variant.id) || null,
          }
        })

        const totalVariantStock = variants.reduce((sum, v) => sum + v.stock, 0)

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          categoryTitle: category?.title || 'Uncategorized',
          subcategoryName: subcategory?.name || null,
          hasVariants: product.has_variants,
          isActive: product.is_active,
          thumbnail: firstProductImage.get(product.id) || null,
          price: product.price,
          sellingPrice: product.selling_price,
          stock: product.has_variants ? totalVariantStock : product.stock,
          variants,
        }
      })

      setCategories(categoryRows)
      setProducts(assembled)
    } catch (error) {
      console.error('Error loading inventory:', error)
      alert('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const setRowSaving = (id: string, isSaving: boolean) => {
    setSavingIds((previous) => {
      const next = new Set(previous)
      if (isSaving) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // Simple (non-variant) product: stock lives directly on products.stock.
  const updateProductStock = async (productId: string, nextStock: number) => {
    setRowSaving(productId, true)
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: nextStock })
        .eq('id', productId)

      if (error) throw error

      setProducts((previous) =>
        previous.map((product) =>
          product.id === productId ? { ...product, stock: nextStock } : product
        )
      )
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('Failed to update stock')
    } finally {
      setRowSaving(productId, false)
    }
  }

  // Variant product: stock lives on product_variants.stock, and the
  // parent row's displayed total is the sum of its variants — so we
  // recompute that total locally after a successful write.
  const updateVariantStock = async (
    productId: string,
    variantId: string,
    nextStock: number
  ) => {
    setRowSaving(variantId, true)
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock: nextStock })
        .eq('id', variantId)

      if (error) throw error

      setProducts((previous) =>
        previous.map((product) => {
          if (product.id !== productId) return product

          const variants = product.variants.map((variant) =>
            variant.id === variantId ? { ...variant, stock: nextStock } : variant
          )

          return {
            ...product,
            variants,
            stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
          }
        })
      )
    } catch (error) {
      console.error('Error updating variant stock:', error)
      alert('Failed to update stock')
    } finally {
      setRowSaving(variantId, false)
    }
  }

  const stats = useMemo(() => {
    let totalUnits = 0
    let lowCount = 0
    let outCount = 0

    for (const product of products) {
      const rows = product.hasVariants
        ? product.variants.map((v) => v.stock)
        : [product.stock]

      for (const stock of rows) {
        totalUnits += stock
        const status = getStockStatus(stock)
        if (status.key === 'low') lowCount += 1
        if (status.key === 'out') outCount += 1
      }
    }

    return {
      totalProducts: products.length,
      totalUnits,
      lowCount,
      outCount,
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return products.filter((product) => {
      if (categoryFilter && product.categoryTitle !== categoryFilter) {
        return false
      }

      if (query) {
        const haystack = [
          product.name,
          product.sku,
          ...product.variants.map((v) => v.sku),
          ...product.variants.map((v) => v.label),
        ]
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(query)) return false
      }

      if (stockFilter !== 'all') {
        if (product.hasVariants) {
          const matchesAnyVariant = product.variants.some(
            (variant) => getStockStatus(variant.stock).key === stockFilter
          )
          if (!matchesAnyVariant) return false
        } else {
          if (getStockStatus(product.stock).key !== stockFilter) return false
        }
      }

      return true
    })
  }, [products, search, categoryFilter, stockFilter])

  const toggleExpanded = (productId: string) => {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#5A7469] gap-2">
        <Boxes className="w-5 h-5 animate-pulse" />
        <span className="text-sm">Loading inventory…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-xs">
      {/* HEADER */}
      <div>
        <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
          Inventory
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Stock across every product — simple items and every color / size
          combination of a variant product, read the same way.
        </p>
      </div>

      {/* STATS */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Products" value={stats.totalProducts} />
        <StatCard label="Units in stock" value={stats.totalUnits} accent="#C5A059" />
        <StatCard label="Low stock lines" value={stats.lowCount} accent="#C97C2C" />
        <StatCard label="Out of stock lines" value={stats.outCount} accent="#E0748C" />
      </div>

      {/* FILTERS */}
      <div className="bg-white border border-[#E2DBD0] rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5A7469] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by product name or SKU"
            className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.title}>
              {category.title}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'in', label: 'In stock' },
              { key: 'low', label: 'Low' },
              { key: 'out', label: 'Out' },
            ] as { key: StockFilter; label: string }[]
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setStockFilter(option.key)}
              className={`px-3.5 py-2.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                stockFilter === option.key
                  ? 'bg-[#0B241C] border-[#0B241C] text-white'
                  : 'bg-white border-[#E2DBD0] text-[#0B241C] hover:border-[#C5A059]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCT LIST */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#E2DBD0] rounded-3xl p-10 text-center text-[#5A7469]">
          <Package className="w-6 h-6 mx-auto mb-2 text-[#C5A059]" />
          No products match these filters.
        </div>
      ) : (
        <div className="bg-white border border-[#E2DBD0] rounded-3xl overflow-hidden">
          {filteredProducts.map((product, index) => {
            const isOpen = expanded.has(product.id)

            return (
              <div
                key={product.id}
                className={index > 0 ? 'border-t border-[#EFEBE3]' : ''}
              >
                {/* MAIN ROW — same shape whether it has variants or not */}
                <div
                  role={product.hasVariants ? 'button' : undefined}
                  tabIndex={product.hasVariants ? 0 : undefined}
                  onClick={() =>
                    product.hasVariants ? toggleExpanded(product.id) : undefined
                  }
                  onKeyDown={(event) => {
                    if (!product.hasVariants) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      toggleExpanded(product.id)
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
                    product.hasVariants ? 'cursor-pointer hover:bg-[#FAF8F5]' : ''
                  } ${isOpen ? 'bg-[#0B241C]/[0.035]' : ''}`}
                  style={
                    isOpen
                      ? { boxShadow: 'inset 3px 0 0 0 #C5A059' }
                      : undefined
                  }
                >
                  <div className="w-4 shrink-0">
                    {product.hasVariants ? (
                      isOpen ? (
                        <ChevronDown className="w-4 h-4 text-[#C5A059]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#5A7469]" />
                      )
                    ) : null}
                  </div>

                  <Thumbnail url={product.thumbnail} />

                  <div className="flex-1 min-w-0">
                    <p className="font-serif-title font-bold text-[13.5px] text-[#0B241C] truncate">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-[#5A7469]">
                      {product.categoryTitle}
                      {product.subcategoryName ? ` · ${product.subcategoryName}` : ''}
                      {'  ·  '}
                      {product.sku}
                    </p>
                  </div>

                  {product.hasVariants ? (
                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold transition-colors ${
                          isOpen
                            ? 'border-[#C5A059] text-[#0B241C] bg-[#C5A059]/10'
                            : 'border-[#E2DBD0] text-[#5A7469]'
                        }`}
                      >
                        {product.variants.length} variant
                        {product.variants.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#0B241C]">
                        {formatCurrency(product.sellingPrice)}
                      </p>
                      {product.price !== product.sellingPrice && (
                        <p className="text-[10px] text-[#5A7469] line-through">
                          {formatCurrency(product.price)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="w-[150px] flex justify-end shrink-0">
                    {product.hasVariants ? (
                      <StockBadge stock={product.stock} />
                    ) : (
                      <StockControl
                        stock={product.stock}
                        saving={savingIds.has(product.id)}
                        onChange={(nextStock) =>
                          updateProductStock(product.id, nextStock)
                        }
                      />
                    )}
                  </div>
                </div>

                {/* VARIANT DRAWER — an inset nested panel, tree-connected back to the
                    chevron above, so it reads as "these belong to this product" rather
                    than more rows in the same flat list. Smaller thumbnail, lighter
                    type weight, and a hairline spine give it a clear step down in
                    visual weight from the product row. */}
                {product.hasVariants && isOpen && (
                  <div className="bg-[#0B241C]/[0.025] px-5 pt-1 pb-3">
                    <div
                      className="relative rounded-2xl border border-[#E2DBD0] bg-white overflow-hidden"
                      style={{ boxShadow: 'inset 3px 0 0 0 #C5A059' }}
                    >
                      {/* spine running past every variant, tying them to one source */}
                      <div className="absolute left-9 top-0 bottom-0 w-px bg-[#C5A059]/25" />

                      {product.variants.map((variant, variantIndex) => (
                        <div
                          key={variant.id}
                          className={`relative flex items-center gap-3 pl-11 pr-4 py-2.5 ${
                            variantIndex > 0 ? 'border-t border-[#EFEBE3]' : ''
                          }`}
                        >
                          {/* branch stub off the spine into this variant */}
                          <span className="absolute left-9 top-1/2 w-2 h-px bg-[#C5A059]/40" />

                          <Thumbnail url={variant.thumbnail} size={32} />

                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            {variant.colorHex && (
                              <span
                                className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: variant.colorHex }}
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-[12px] text-[#0B241C] truncate leading-tight">
                                {variant.label}
                              </p>
                              <p className="text-[10.5px] text-[#5A7469]">
                                {variant.sku}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-semibold text-[#0B241C]">
                              {formatCurrency(variant.selling_price)}
                            </p>
                            {variant.price !== variant.selling_price && (
                              <p className="text-[10px] text-[#5A7469] line-through">
                                {formatCurrency(variant.price)}
                              </p>
                            )}
                          </div>

                          <div className="w-[150px] flex justify-end shrink-0">
                            <StockControl
                              compact
                              stock={variant.stock}
                              saving={savingIds.has(variant.id)}
                              onChange={(nextStock) =>
                                updateVariantStock(product.id, variant.id, nextStock)
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}