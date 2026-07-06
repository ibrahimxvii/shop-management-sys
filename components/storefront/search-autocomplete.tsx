"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ImageOff } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useStorefrontProducts } from "@/hooks/use-storefront";
import { formatCurrency, cn } from "@/lib/utils";

export function SearchAutocomplete() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 250);

  const { data } = useStorefrontProducts(
    debouncedQuery.trim().length >= 2 ? { search: debouncedQuery, limit: 6 } : undefined
  );
  const results = debouncedQuery.trim().length >= 2 ? data?.products ?? [] : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              router.push(`/store/products?search=${encodeURIComponent(query.trim())}`);
              setOpen(false);
            }
          }}
          placeholder="Search products..."
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
          {results.map((product) => {
            const image = product.images.find((i) => i.is_primary)?.url ?? product.images[0]?.url ?? null;
            return (
              <button
                key={product.id}
                onClick={() => {
                  router.push(`/store/products/${product.id}`);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors cursor-pointer"
                )}
              >
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                  {image ? (
                    <Image src={image} alt={product.name} fill className="object-cover" sizes="36px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground/40">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(product.selling_price)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
