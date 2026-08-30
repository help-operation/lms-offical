"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CaretLeft, Plus, X, CircleNotch } from "@phosphor-icons/react";
import { shopAdminBrowser, type ShopProduct } from "./browser";

interface Props {
  mode: "create" | "edit";
  product?: ShopProduct;
}

const PRODUCT_TYPES = ["physical", "digital", "bundle", "tool"] as const;

export function ShopProductFormClient({ mode, product }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: product?.title ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    shortDescription: product?.shortDescription ?? "",
    type: (product?.type ?? "physical") as ShopProduct["type"],
    price: product?.price ?? "",
    discountPrice: product?.discountPrice ?? "",
    stock: product?.stock !== undefined && product.stock !== null ? String(product.stock) : "",
    downloadUrl: product?.downloadUrl ?? "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    sortOrder: String(product?.sortOrder ?? 0),
    metaTitle: product?.metaTitle ?? "",
    metaDescription: product?.metaDescription ?? "",
    images: product?.images ?? [] as string[],
    newImageUrl: "",
  });

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  const set = (key: keyof typeof form, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addImage = () => {
    if (!form.newImageUrl.trim()) return;
    set("images", [...form.images, form.newImageUrl.trim()]);
    set("newImageUrl", "");
  };

  const removeImage = (i: number) =>
    set("images", form.images.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.slug.trim()) { setError("Slug is required"); return; }
    if (!form.price) { setError("Price is required"); return; }

    const dto = {
      title: form.title,
      slug: form.slug,
      description: form.description || null,
      shortDescription: form.shortDescription || null,
      type: form.type,
      price: form.price,
      discountPrice: form.discountPrice || null,
      images: form.images,
      stock: form.stock !== "" ? Number(form.stock) : null,
      downloadUrl: form.downloadUrl || null,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder),
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
    };

    startTransition(async () => {
      try {
        if (mode === "create") {
          await shopAdminBrowser.createProduct(dto as Parameters<typeof shopAdminBrowser.createProduct>[0]);
        } else {
          await shopAdminBrowser.updateProduct(product!.id, dto);
        }
        router.push("/admin/shop/products");
        router.refresh();
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e?.message ?? "Something went wrong");
      }
    });
  };

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/shop/products" className="text-gray-400 hover:text-gray-600 transition-colors">
          <CaretLeft size={22} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "create" ? "New Product" : "Edit Product"}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-base">Basic Info</h2>

          <div>
            <label className={labelCls}>Title *</label>
            <input
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (mode === "create") set("slug", slugify(e.target.value));
              }}
              className={inputCls}
              placeholder="Product name"
              required
            />
          </div>

          <div>
            <label className={labelCls}>Slug *</label>
            <input
              value={form.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              className={inputCls}
              placeholder="product-slug"
              required
            />
          </div>

          <div>
            <label className={labelCls}>Product Type *</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Short Description</label>
            <input
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              className={inputCls}
              placeholder="Brief one-line description"
            />
          </div>

          <div>
            <label className={labelCls}>Full Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className={`${inputCls} resize-none`}
              placeholder="Detailed product description"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-base">Pricing & Inventory</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Price (BDT) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                className={inputCls}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Sale Price (BDT)</label>
              <input
                type="number"
                value={form.discountPrice}
                onChange={(e) => set("discountPrice", e.target.value)}
                className={inputCls}
                min="0"
                step="0.01"
                placeholder="Leave blank for no discount"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Stock Quantity</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                className={inputCls}
                min="0"
                placeholder="Leave blank for unlimited"
              />
            </div>
            <div>
              <label className={labelCls}>Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                className={inputCls}
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {(form.type === "digital" || form.type === "bundle") && (
            <div>
              <label className={labelCls}>Download URL</label>
              <input
                value={form.downloadUrl}
                onChange={(e) => set("downloadUrl", e.target.value)}
                className={inputCls}
                placeholder="https://... (delivered after payment)"
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-base">Product Images</h2>
          <div className="flex gap-2">
            <input
              value={form.newImageUrl}
              onChange={(e) => set("newImageUrl", e.target.value)}
              className={`${inputCls} flex-1`}
              placeholder="Image URL (https://...)"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
            />
            <button type="button" onClick={addImage} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={14} /> Add
            </button>
          </div>
          {form.images.length > 0 && (
            <div className="space-y-2">
              {form.images.map((url, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 flex-1 truncate">{url}</span>
                  <button type="button" onClick={() => removeImage(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-base">Settings</h2>
          <div className="space-y-3">
            {([
              { key: "isActive", label: "Active (visible in shop)" },
              { key: "isFeatured", label: "Featured product" },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className={labelCls}>Meta Title</label>
            <input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={inputCls} placeholder="SEO title" />
          </div>
          <div>
            <label className={labelCls}>Meta Description</label>
            <textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="SEO description" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {isPending && <CircleNotch size={16} className="animate-spin" />}
            {mode === "create" ? "Create Product" : "Save Changes"}
          </button>
          <Link href="/admin/shop/products" className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
