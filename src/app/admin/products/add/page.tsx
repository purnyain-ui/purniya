'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
  Package,
  ImageIcon,
  Sparkles,
  Layers,
  Tag,
  ArrowLeft,
  Save,
} from 'lucide-react'

import {
  supabase,
  PRODUCT_IMAGES_BUCKET,
} from '../../../../lib/supabaseClient'

// ---------------------------------------------------------------
// Design tokens (shared with the Categories admin page)
//   ink    #0B241C  -> headings, primary buttons, active states
//   gold   #C5A059  -> accents, hover states  (deep hover #D4AF37)
//   paper  #FAF8F5  -> input backgrounds, dashed dropzones
//   line   #E2DBD0  -> borders
//   line-2 #EFEBE3  -> hairline dividers inside cards
//   sage   #5A7469  -> secondary / muted text
// ---------------------------------------------------------------

type Category = {
  id: string
  title: string
  slug: string
}

type Subcategory = {
  id: string
  category_id: string
  name: string
}

type LifestyleTag = {
  id: string
  name: string | null
  is_active: boolean
}

type Color = {
  id: string
  name: string
  hex: string
  category: string
}

type Size = {
  id: string
  name: string
  category: string
  dimension: string
}

type ProductVariantForm = {
  tempId: string
  color_id: string
  size_id: string
  sku: string
  price: string
  selling_price: string
  stock: string
  images: File[]
  existingImages: string[]
}

type ExistingImage = {
  id: string
  image_url: string
  sort_order: number
}

const normalize = (value: string | null | undefined) =>
  (value || '').trim().toLowerCase()

const createSlug = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const createTempId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-[#0B241C] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#C5A059]" />
      </div>
      <div>
        <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-[#5A7469]">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

// Wrap the main component in Suspense for useSearchParams
export default function AdminAddProductWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-[#5A7469] gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    }>
      <AdminAddProductPage />
    </Suspense>
  )
}

function AdminAddProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const isEditMode = Boolean(editId)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [lifestyleTags, setLifestyleTags] = useState<LifestyleTag[]>([])

  const [allColors, setAllColors] = useState<Color[]>([])
  const [allSizes, setAllSizes] = useState<Size[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sku, setSku] = useState('')
  const [featureInput, setFeatureInput] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [lifestyleTagId, setLifestyleTagId] = useState('')

  const [featured, setFeatured] = useState(false)
  const [hasVariants, setHasVariants] = useState(false)

  // NO VARIANT PRODUCT
  const [price, setPrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [stock, setStock] = useState('')

  const [productImages, setProductImages] = useState<File[]>([])
  const [existingProductImages, setExistingProductImages] = useState<ExistingImage[]>([])

  // VARIANTS
  const [variants, setVariants] = useState<ProductVariantForm[]>([
    {
      tempId: createTempId(),
      color_id: '',
      size_id: '',
      sku: '',
      price: '',
      selling_price: '',
      stock: '',
      images: [],
      existingImages: [],
    },
  ])

  const selectedCategory = useMemo(() => {
    return categories.find((category) => category.id === categoryId)
  }, [categoryId, categories])

  const filteredSubcategories = useMemo(() => {
    return subcategories.filter(
      (subcategory) => subcategory.category_id === categoryId
    )
  }, [subcategories, categoryId])

  const selectedSubcategory = useMemo(() => {
    return subcategories.find((subcategory) => subcategory.id === subcategoryId)
  }, [subcategoryId, subcategories])

  const colors = useMemo(() => {
    if (!selectedCategory) return []
    return allColors.filter(
      (color) => normalize(color.category) === normalize(selectedCategory.title)
    )
  }, [allColors, selectedCategory])

  const sizes = useMemo(() => {
    if (!selectedCategory) return []

    if (filteredSubcategories.length > 0) {
      if (!selectedSubcategory) return []
      return allSizes.filter(
        (size) => normalize(size.category) === normalize(selectedSubcategory.name)
      )
    }

    return allSizes.filter(
      (size) => normalize(size.category) === normalize(selectedCategory.title)
    )
  }, [allSizes, selectedCategory, selectedSubcategory, filteredSubcategories])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!isEditMode) {
      setSubcategoryId('')
    }
  }, [categoryId])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      const [
        categoriesResponse,
        subcategoriesResponse,
        lifestyleResponse,
        colorsResponse,
        sizesResponse,
      ] = await Promise.all([
        supabase.from('categories').select('id,title,slug').order('title'),
        supabase
          .from('subcategories')
          .select('id,category_id,name')
          .order('sort_order'),
        supabase
          .from('lifestyle_sale_tags')
          .select('id,name,is_active')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('color_palettes')
          .select('id,name,hex,category')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('size_variants')
          .select('id,name,category,dimension')
          .eq('is_active', true)
          .order('name'),
      ])

      if (categoriesResponse.error) throw categoriesResponse.error
      if (subcategoriesResponse.error) throw subcategoriesResponse.error
      if (lifestyleResponse.error) throw lifestyleResponse.error
      if (colorsResponse.error) throw colorsResponse.error
      if (sizesResponse.error) throw sizesResponse.error

      setCategories(categoriesResponse.data || [])
      setSubcategories(subcategoriesResponse.data || [])
      setLifestyleTags(lifestyleResponse.data || [])
      setAllColors(colorsResponse.data || [])
      setAllSizes(sizesResponse.data || [])

      // If editing, load the product data
      if (editId) {
        await loadProductForEdit(editId)
      }
    } catch (error) {
      console.error('Error loading product data:', error)
      alert('Failed to load product form data')
    } finally {
      setLoading(false)
    }
  }

  const loadProductForEdit = async (productId: string) => {
    try {
      // 1. Fetch product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) throw productError
      if (!product) throw new Error('Product not found')

      // 2. Populate fields
      setName(product.name || '')
      setDescription(product.description || '')
      setSku(product.sku || '')
      setCategoryId(product.category_id || '')
      setSubcategoryId(product.subcategory_id || '')
      setLifestyleTagId(product.lifestyle_tag_id || '')
      setFeatured(product.is_featured || false)
      setHasVariants(product.has_variants || false)
      setPrice(product.price != null ? String(product.price) : '')
      setSellingPrice(product.selling_price != null ? String(product.selling_price) : '')
      setStock(product.stock != null ? String(product.stock) : '')

      // 3. Fetch features
      const { data: featuresData } = await supabase
        .from('product_features')
        .select('feature')
        .eq('product_id', productId)
        .order('sort_order')

      if (featuresData) {
        setFeatures(featuresData.map((f: { feature: string }) => f.feature))
      }

      // 4. Fetch product images (for non-variant products)
      const { data: imagesData } = await supabase
        .from('product_images')
        .select('id, image_url, sort_order')
        .eq('product_id', productId)
        .order('sort_order')

      if (imagesData) {
        setExistingProductImages(imagesData)
      }

      // 5. Fetch variants
      if (product.has_variants) {
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .order('created_at')

        if (variantsData && variantsData.length > 0) {
          const variantForms: ProductVariantForm[] = []

          for (const v of variantsData) {
            // Fetch variant images
            const { data: vImages } = await supabase
              .from('product_variant_images')
              .select('image_url')
              .eq('variant_id', v.id)
              .order('sort_order')

            variantForms.push({
              tempId: v.id,
              color_id: v.color_id || '',
              size_id: v.size_id || '',
              sku: v.sku || '',
              price: v.price != null ? String(v.price) : '',
              selling_price: v.selling_price != null ? String(v.selling_price) : '',
              stock: v.stock != null ? String(v.stock) : '',
              images: [],
              existingImages: vImages ? vImages.map((i: { image_url: string }) => i.image_url) : [],
            })
          }

          setVariants(variantForms)
        }
      }
    } catch (error) {
      console.error('Error loading product for edit:', error)
      alert('Failed to load product data for editing')
    }
  }

  const addFeature = () => {
    const newFeature = featureInput.trim()
    if (!newFeature) return

    if (features.includes(newFeature)) {
      alert('This feature already exists')
      return
    }

    setFeatures((previous) => [...previous, newFeature])
    setFeatureInput('')
  }

  const removeFeature = (index: number) => {
    setFeatures((previous) =>
      previous.filter((_, featureIndex) => featureIndex !== index)
    )
  }

  const addVariant = () => {
    setVariants((previous) => [
      ...previous,
      {
        tempId: createTempId(),
        color_id: '',
        size_id: '',
        sku: '',
        price: '',
        selling_price: '',
        stock: '',
        images: [],
        existingImages: [],
      },
    ])
  }

  const removeVariant = (tempId: string) => {
    if (variants.length === 1) {
      alert('At least one variant is required')
      return
    }

    setVariants((previous) =>
      previous.filter((variant) => variant.tempId !== tempId)
    )
  }

  const generateProductSKU = async () => {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    const nextNumber = (count || 0) + 1
    return `PROD-${String(nextNumber).padStart(6, '0')}`
  }

  const generateVariantSKU = (productSKU: string, index: number) => {
    return `${productSKU}-VAR-${String(index + 1).padStart(3, '0')}`
  }

  const updateVariant = (
    tempId: string,
    field: keyof ProductVariantForm,
    value: string | File[] | string[]
  ) => {
    setVariants((previous) =>
      previous.map((variant) =>
        variant.tempId === tempId
          ? { ...variant, [field]: value }
          : variant
      )
    )
  }

  const handleProductImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return
    setProductImages((previous) => [
      ...previous,
      ...Array.from(event.target.files || []),
    ])
  }

  const removeProductImage = (index: number) => {
    setProductImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    )
  }

  const removeExistingProductImage = (imageId: string) => {
    setExistingProductImages((previous) =>
      previous.filter((img) => img.id !== imageId)
    )
  }

  const handleVariantImageChange = (
    tempId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return
    const files = Array.from(event.target.files)
    const currentVariant = variants.find((variant) => variant.tempId === tempId)

    updateVariant(tempId, 'images', [
      ...(currentVariant?.images || []),
      ...files,
    ])
  }

  const removeVariantImage = (tempId: string, imageIndex: number) => {
    setVariants((previous) =>
      previous.map((variant) => {
        if (variant.tempId !== tempId) return variant
        return {
          ...variant,
          images: variant.images.filter((_, index) => index !== imageIndex),
        }
      })
    )
  }

  const removeVariantExistingImage = (tempId: string, imageUrl: string) => {
    setVariants((previous) =>
      previous.map((variant) => {
        if (variant.tempId !== tempId) return variant
        return {
          ...variant,
          existingImages: variant.existingImages.filter((url) => url !== imageUrl),
        }
      })
    )
  }

  const uploadImage = async (file: File, productId: string, folder: string) => {
    const extension = file.name.split('.').pop()
    const fileName = `${productId}/${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setSku('')
    setFeatures([])
    setFeatureInput('')

    setCategoryId('')
    setSubcategoryId('')
    setLifestyleTagId('')

    setFeatured(false)
    setHasVariants(false)

    setPrice('')
    setSellingPrice('')
    setStock('')

    setProductImages([])
    setExistingProductImages([])

    setVariants([
      {
        tempId: createTempId(),
        color_id: '',
        size_id: '',
        sku: '',
        price: '',
        selling_price: '',
        stock: '',
        images: [],
        existingImages: [],
      },
    ])
  }

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        alert('Please enter product name')
        return
      }

      if (!categoryId) {
        alert('Please select category')
        return
      }

      if (!hasVariants) {
        if (!price || !sellingPrice || stock === '') {
          alert('Please enter price, selling price and stock')
          return
        }
      }

      if (hasVariants) {
        for (let variantIndex = 0; variantIndex < variants.length; variantIndex++) {
          const variant = variants[variantIndex]
          if (!variant.price || !variant.selling_price || variant.stock === '') {
            alert('Please fill price, selling price and stock for every variant')
            return
          }
        }
      }

      setSaving(true)

      if (isEditMode && editId) {
        // ============ UPDATE MODE ============
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            category_id: categoryId,
            subcategory_id: subcategoryId || null,
            lifestyle_tag_id: lifestyleTagId || null,
            is_featured: featured,
            has_variants: hasVariants,
            price: hasVariants ? null : Number(price),
            selling_price: hasVariants ? null : Number(sellingPrice),
            stock: hasVariants ? 0 : Number(stock),
          })
          .eq('id', editId)

        if (updateError) throw updateError

        // Update features: delete old ones, insert new ones
        await supabase.from('product_features').delete().eq('product_id', editId)
        if (features.length > 0) {
          const featureRows = features.map((feature, index) => ({
            product_id: editId,
            feature,
            sort_order: index,
          }))
          const { error: featuresError } = await supabase
            .from('product_features')
            .insert(featureRows)
          if (featuresError) throw featuresError
        }

        // Update product images
        if (!hasVariants) {
          // Delete images that were removed
          const keepImageIds = existingProductImages.map((img) => img.id)
          await supabase
            .from('product_images')
            .delete()
            .eq('product_id', editId)
            .not('id', 'in', `(${keepImageIds.join(',')})`)

          // Upload new images
          if (productImages.length > 0) {
            const startSortOrder = existingProductImages.length
            const imageRows = []
            for (let index = 0; index < productImages.length; index++) {
              const file = productImages[index]
              const imageUrl = await uploadImage(file, editId, 'product')
              imageRows.push({
                product_id: editId,
                image_url: imageUrl,
                sort_order: startSortOrder + index,
              })
            }
            const { error: imagesError } = await supabase
              .from('product_images')
              .insert(imageRows)
            if (imagesError) throw imagesError
          }
        }

        // Update variants
        if (hasVariants) {
          // Delete old variants and their images
          const { data: oldVariants } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', editId)

          if (oldVariants && oldVariants.length > 0) {
            const oldIds = oldVariants.map((v: { id: string }) => v.id)
            await supabase.from('product_variant_images').delete().in('variant_id', oldIds)
            await supabase.from('product_variants').delete().eq('product_id', editId)
          }

          // Insert new variants
          const productSKU = sku || await generateProductSKU()
          for (let variantIndex = 0; variantIndex < variants.length; variantIndex++) {
            const variant = variants[variantIndex]

            const { data: createdVariant, error: variantError } = await supabase
              .from('product_variants')
              .insert({
                product_id: editId,
                color_id: variant.color_id || null,
                size_id: variant.size_id || null,
                sku: generateVariantSKU(productSKU, variantIndex),
                price: Number(variant.price),
                selling_price: Number(variant.selling_price),
                stock: Number(variant.stock),
                is_active: true,
              })
              .select()
              .single()

            if (variantError) throw variantError

            // Upload new variant images
            const allVariantImageRows = []

            // Re-add existing images that weren't removed
            for (let i = 0; i < variant.existingImages.length; i++) {
              allVariantImageRows.push({
                variant_id: createdVariant.id,
                image_url: variant.existingImages[i],
                sort_order: i,
              })
            }

            // Upload new files
            for (let index = 0; index < variant.images.length; index++) {
              const file = variant.images[index]
              const imageUrl = await uploadImage(
                file,
                editId,
                `variants/${createdVariant.id}`
              )
              allVariantImageRows.push({
                variant_id: createdVariant.id,
                image_url: imageUrl,
                sort_order: variant.existingImages.length + index,
              })
            }

            if (allVariantImageRows.length > 0) {
              const { error: variantImagesError } = await supabase
                .from('product_variant_images')
                .insert(allVariantImageRows)
              if (variantImagesError) throw variantImagesError
            }
          }
        }

        alert('Product updated successfully')
        router.push('/admin/products')
      } else {
        // ============ INSERT MODE ============
        const slug = `${createSlug(name)}-${Date.now()}`
        const generatedProductSKU = await generateProductSKU()

        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            name: name.trim(),
            slug,
            description: description.trim() || null,
            sku: generatedProductSKU,
            category_id: categoryId,
            subcategory_id: subcategoryId || null,
            lifestyle_tag_id: lifestyleTagId || null,
            is_featured: featured,
            has_variants: hasVariants,
            price: hasVariants ? null : Number(price),
            selling_price: hasVariants ? null : Number(sellingPrice),
            stock: hasVariants ? 0 : Number(stock),
            is_active: true,
          })
          .select()
          .single()

        if (productError) throw productError

        if (features.length > 0) {
          const featureRows = features.map((feature, index) => ({
            product_id: product.id,
            feature,
            sort_order: index,
          }))
          const { error: featuresError } = await supabase
            .from('product_features')
            .insert(featureRows)
          if (featuresError) throw featuresError
        }

        if (!hasVariants) {
          if (productImages.length > 0) {
            const imageRows = []
            for (let index = 0; index < productImages.length; index++) {
              const file = productImages[index]
              const imageUrl = await uploadImage(file, product.id, 'product')
              imageRows.push({
                product_id: product.id,
                image_url: imageUrl,
                sort_order: index,
              })
            }
            const { error: imagesError } = await supabase
              .from('product_images')
              .insert(imageRows)
            if (imagesError) throw imagesError
          }
        }

        if (hasVariants) {
          for (let variantIndex = 0; variantIndex < variants.length; variantIndex++) {
            const variant = variants[variantIndex]

            const { data: createdVariant, error: variantError } = await supabase
              .from('product_variants')
              .insert({
                product_id: product.id,
                color_id: variant.color_id || null,
                size_id: variant.size_id || null,
                sku: generateVariantSKU(generatedProductSKU, variantIndex),
                price: Number(variant.price),
                selling_price: Number(variant.selling_price),
                stock: Number(variant.stock),
                is_active: true,
              })
              .select()
              .single()

            if (variantError) throw variantError

            if (variant.images.length > 0) {
              const imageRows = []
              for (let index = 0; index < variant.images.length; index++) {
                const file = variant.images[index]
                const imageUrl = await uploadImage(
                  file,
                  product.id,
                  `variants/${createdVariant.id}`
                )
                imageRows.push({
                  variant_id: createdVariant.id,
                  image_url: imageUrl,
                  sort_order: index,
                })
              }
              const { error: variantImagesError } = await supabase
                .from('product_variant_images')
                .insert(imageRows)
              if (variantImagesError) throw variantImagesError
            }
          }
        }

        alert('Product created successfully')
        resetForm()
      }
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert(error?.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#5A7469] gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading product form…</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/admin/products')}
            className="flex items-center gap-1.5 text-[#5A7469] hover:text-[#0B241C] font-semibold transition-colors mb-3 cursor-pointer w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </button>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {isEditMode ? 'Edit Product' : 'Add a New Product'}
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            {isEditMode
              ? 'Update the details below and save your changes.'
              : 'Fill in the details below — it will appear in the boutique once saved.'}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-60 cursor-pointer self-start sm:self-auto"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving…' : 'Save Product'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          {/* PRODUCT DETAILS */}
          <div className="bg-white border border-[#E2DBD0] rounded-3xl p-6 shadow-sm">
            <SectionHeader
              icon={Package}
              title="Product Details"
              subtitle="Name, description and the SKU used across the boutique"
            />

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  Product Name
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Baroque Pearl Choker"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the piece, materials and craftsmanship"
                  rows={5}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059] resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  Product SKU
                </label>
                <div className="px-3.5 py-2.5 bg-[#FAF8F5] border border-dashed border-[#E2DBD0] rounded-xl text-[#5A7469] font-semibold">
                  {sku || 'Generated automatically when you save'}
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCT FEATURES */}
          <div className="bg-white border border-[#E2DBD0] rounded-3xl p-6 shadow-sm">
            <SectionHeader
              icon={Sparkles}
              title="Product Features"
              subtitle="Short highlights shown as a bullet list on the product page"
            />

            <div className="flex gap-3">
              <textarea
                value={featureInput}
                onChange={(event) => setFeatureInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    addFeature()
                  }
                }}
                placeholder="e.g. Hand-set freshwater pearls"
                rows={2}
                className="flex-1 px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059] resize-none"
              />

              <button
                type="button"
                onClick={addFeature}
                className="px-5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {features.length > 0 ? (
              <div className="mt-5 space-y-2.5">
                {features.map((feature, index) => (
                  <div
                    key={`${feature}-${index}`}
                    className="flex items-center justify-between border border-[#E2DBD0] rounded-xl px-4 py-3 bg-[#FAF8F5]/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-[10px]">
                        {index + 1}
                      </div>
                      <p className="font-semibold text-[#0B241C]">{feature}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 border-2 border-dashed border-[#E2DBD0] rounded-2xl p-6 text-center text-[#5A7469]">
                No features added yet
              </div>
            )}
          </div>

          {/* PRODUCT TYPE */}
          <div className="bg-white border border-[#E2DBD0] rounded-3xl p-6 shadow-sm">
            <SectionHeader
              icon={Layers}
              title="Product Type"
              subtitle="Choose whether this piece comes in one form or several"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setHasVariants(false)}
                className={`text-left rounded-2xl p-5 border-2 transition-colors cursor-pointer ${
                  !hasVariants
                    ? 'border-[#C5A059] bg-[#FAF8F5]'
                    : 'border-[#E2DBD0] hover:border-[#C5A059]/60'
                }`}
              >
                <h3 className="font-bold text-[#0B241C]">No Variations</h3>
                <p className="text-[11px] text-[#5A7469] mt-1.5">
                  One price, selling price and stock count for this product.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setHasVariants(true)}
                className={`text-left rounded-2xl p-5 border-2 transition-colors cursor-pointer ${
                  hasVariants
                    ? 'border-[#C5A059] bg-[#FAF8F5]'
                    : 'border-[#E2DBD0] hover:border-[#C5A059]/60'
                }`}
              >
                <h3 className="font-bold text-[#0B241C]">Has Variations</h3>
                <p className="text-[11px] text-[#5A7469] mt-1.5">
                  Different colors, sizes, prices, stock and images.
                </p>
              </button>
            </div>
          </div>

          {/* NORMAL PRODUCT PRICING */}
          {!hasVariants && (
            <div className="bg-white border border-[#E2DBD0] rounded-3xl p-6 shadow-sm">
              <SectionHeader icon={Tag} title="Pricing & Stock" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#0B241C] mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="₹ 0"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0B241C] mb-1">
                    Selling Price
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(event) => setSellingPrice(event.target.value)}
                    placeholder="₹ 0"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0B241C] mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* NORMAL PRODUCT IMAGES */}
          {!hasVariants && (
            <div className="bg-white border border-[#E2DBD0] rounded-3xl p-6 shadow-sm">
              <SectionHeader
                icon={ImageIcon}
                title="Product Images"
                subtitle="The first image becomes the primary thumbnail"
              />

              <label className="block p-6 rounded-2xl border-2 border-dashed border-[#E2DBD0] hover:border-[#C5A059] bg-[#FAF8F5] transition-colors text-center cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleProductImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                <p className="font-bold text-[#0B241C]">
                  Click or Drag to Upload Images
                </p>
                <p className="text-[10px] text-[#5A7469] mt-1">
                  Uploads to Supabase Storage on save
                </p>
              </label>

              {(existingProductImages.length > 0 || productImages.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                  {/* Existing images from database */}
                  {existingProductImages.map((img, index) => (
                    <div
                      key={img.id}
                      className="relative rounded-2xl overflow-hidden border border-[#E2DBD0]"
                    >
                      <img
                        src={img.image_url}
                        alt=""
                        className="w-full aspect-square object-cover"
                      />
                      {index === 0 && productImages.length === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#0B241C] text-[#C5A059] text-[10px] font-bold">
                          Primary
                        </span>
                      )}
                      <button
                        onClick={() => removeExistingProductImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-[#0B241C]" />
                      </button>
                    </div>
                  ))}
                  {/* New images picked by user */}
                  {productImages.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="relative rounded-2xl overflow-hidden border-2 border-[#C5A059]"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-full aspect-square object-cover"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#C5A059] text-white text-[10px] font-bold">
                        New
                      </span>
                      <button
                        onClick={() => removeProductImage(index)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-[#0B241C]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VARIANTS */}
          {hasVariants && (
            <div className="bg-white border border-[#E2DBD0] rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6 gap-4">
                <SectionHeader
                  icon={Layers}
                  title="Product Variations"
                  subtitle="Colors and sizes are pulled from the selected category / subcategory"
                />

                <button
                  type="button"
                  onClick={addVariant}
                  className="px-4 py-2 rounded-xl border border-[#E2DBD0] hover:border-[#C5A059] text-[#0B241C] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variant
                </button>
              </div>

              {!categoryId && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 mb-5 font-semibold">
                  Select a category first to load available colors and sizes.
                </div>
              )}

              {categoryId && filteredSubcategories.length > 0 && !subcategoryId && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 mb-5 font-semibold">
                  &ldquo;{selectedCategory?.title}&rdquo; has subcategories — select a Sub
                  Category (on the right) to load the matching sizes.
                </div>
              )}

              {categoryId && colors.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 mb-5 font-semibold">
                  No colors are set up for &ldquo;{selectedCategory?.title}&rdquo; yet. Add rows
                  to <code>color_palettes</code> with <code>category</code> = &ldquo;{selectedCategory?.title}&rdquo;.
                </div>
              )}

              {categoryId &&
                (filteredSubcategories.length === 0 || subcategoryId) &&
                sizes.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 mb-5 font-semibold">
                    No sizes are set up for &ldquo;{selectedSubcategory?.name || selectedCategory?.title}&rdquo; yet. Add
                    rows to <code>size_variants</code> with{' '}
                    <code>category</code> = &ldquo;{selectedSubcategory?.name || selectedCategory?.title}&rdquo;.
                  </div>
                )}

              <div className="space-y-5">
                {variants.map((variant, variantIndex) => (
                  <div
                    key={variant.tempId}
                    className="border border-[#E2DBD0] rounded-2xl p-5 bg-[#FAF8F5]/40"
                  >
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-[#0B241C]">
                        Variant {variantIndex + 1}
                      </h3>

                      {variants.length > 1 && (
                        <button
                          onClick={() => removeVariant(variant.tempId)}
                          className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* COLOR */}
                      <div>
                        <label className="block font-bold text-[#0B241C] mb-1">
                          Color
                        </label>
                        <select
                          value={variant.color_id}
                          onChange={(event) =>
                            updateVariant(variant.tempId, 'color_id', event.target.value)
                          }
                          disabled={!categoryId}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059] disabled:opacity-50"
                        >
                          <option value="">
                            {colors.length === 0 ? 'No colors available' : 'Select Color'}
                          </option>
                          {colors.map((color) => (
                            <option key={color.id} value={color.id}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SIZE */}
                      <div>
                        <label className="block font-bold text-[#0B241C] mb-1">
                          Size
                        </label>
                        <select
                          value={variant.size_id}
                          onChange={(event) =>
                            updateVariant(variant.tempId, 'size_id', event.target.value)
                          }
                          disabled={
                            !categoryId ||
                            (filteredSubcategories.length > 0 && !subcategoryId)
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059] disabled:opacity-50"
                        >
                          <option value="">
                            {filteredSubcategories.length > 0 && !subcategoryId
                              ? 'Select a subcategory first'
                              : sizes.length === 0
                              ? 'No sizes available'
                              : 'Select Size'}
                          </option>
                          {sizes.map((size) => (
                            <option key={size.id} value={size.id}>
                              {size.name} - {size.dimension}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SKU */}
                      <div>
                        <label className="block font-bold text-[#0B241C] mb-1">
                          Variant SKU
                        </label>
                        <div className="px-3.5 py-2.5 bg-white border border-dashed border-[#E2DBD0] rounded-xl text-[#5A7469] font-semibold">
                          {variant.sku || `Auto generated variant ${variantIndex + 1}`}
                        </div>
                      </div>

                      {/* STOCK */}
                      <div>
                        <label className="block font-bold text-[#0B241C] mb-1">
                          Stock
                        </label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(event) =>
                            updateVariant(variant.tempId, 'stock', event.target.value)
                          }
                          placeholder="0"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>

                      {/* PRICE */}
                      <div>
                        <label className="block font-bold text-[#0B241C] mb-1">
                          Price
                        </label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(event) =>
                            updateVariant(variant.tempId, 'price', event.target.value)
                          }
                          placeholder="₹ 0"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>

                      {/* SELLING PRICE */}
                      <div>
                        <label className="block font-bold text-[#0B241C] mb-1">
                          Selling Price
                        </label>
                        <input
                          type="number"
                          value={variant.selling_price}
                          onChange={(event) =>
                            updateVariant(variant.tempId, 'selling_price', event.target.value)
                          }
                          placeholder="₹ 0"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                    </div>

                    {/* VARIANT IMAGES */}
                    <div className="mt-5">
                      <label className="block font-bold text-[#0B241C] mb-1">
                        Variant Images
                      </label>

                      <label className="block p-5 rounded-2xl border-2 border-dashed border-[#E2DBD0] hover:border-[#C5A059] bg-white transition-colors text-center cursor-pointer relative">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(event) =>
                            handleVariantImageChange(variant.tempId, event)
                          }
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Upload className="w-5 h-5 text-[#C5A059] mx-auto mb-1.5" />
                        <span className="font-semibold text-[#0B241C]">
                          Upload images for this variant
                        </span>
                      </label>

                      {(variant.existingImages.length > 0 || variant.images.length > 0) && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                          {/* Existing variant images */}
                          {variant.existingImages.map((url, imageIndex) => (
                            <div
                              key={`existing-${imageIndex}`}
                              className="relative rounded-xl overflow-hidden border border-[#E2DBD0]"
                            >
                              <img
                                src={url}
                                alt=""
                                className="w-full aspect-square object-cover"
                              />
                              <button
                                onClick={() =>
                                  removeVariantExistingImage(variant.tempId, url)
                                }
                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 hover:bg-white shadow-sm cursor-pointer"
                              >
                                <X className="w-3 h-3 text-[#0B241C]" />
                              </button>
                            </div>
                          ))}
                          {/* New variant images */}
                          {variant.images.map((file, imageIndex) => (
                            <div
                              key={`${file.name}-${imageIndex}`}
                              className="relative rounded-xl overflow-hidden border-2 border-[#C5A059]"
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt=""
                                className="w-full aspect-square object-cover"
                              />
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-[#C5A059] text-white text-[9px] font-bold">
                                New
                              </span>
                              <button
                                onClick={() =>
                                  removeVariantImage(variant.tempId, imageIndex)
                                }
                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 hover:bg-white shadow-sm cursor-pointer"
                              >
                                <X className="w-3 h-3 text-[#0B241C]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* CATEGORY */}
          <div className="bg-white border border-[#E2DBD0] rounded-3xl p-6 shadow-sm">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C] mb-5">
              Product Organization
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  Sub Category
                </label>
                <select
                  value={subcategoryId}
                  disabled={!categoryId}
                  onChange={(event) => setSubcategoryId(event.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059] disabled:opacity-50"
                >
                  <option value="">Select Sub Category</option>
                  {filteredSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  Lifestyle
                </label>
                <select
                  value={lifestyleTagId}
                  onChange={(event) => setLifestyleTagId(event.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="">Select Lifestyle</option>
                  {lifestyleTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name || tag.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeatured(!featured)}
                  className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                    featured ? 'bg-[#C5A059]' : 'bg-[#E2DBD0]'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      featured ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="font-bold text-[#0B241C]">Featured Product</span>
              </div>
            </div>
          </div>

          {/* PRODUCT SUMMARY */}
          <div className="bg-[#0B241C] rounded-3xl p-6 text-white">
            <h3 className="font-serif-title font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
              Product Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white/60">Mode</span>
                <span className="font-semibold">
                  {isEditMode ? 'Editing' : 'Creating'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white/60">Product Type</span>
                <span className="font-semibold">
                  {hasVariants ? 'With Variants' : 'Simple Product'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white/60">Variants</span>
                <span className="font-semibold">
                  {hasVariants ? variants.length : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60">Features Listed</span>
                <span className="font-semibold">{features.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
