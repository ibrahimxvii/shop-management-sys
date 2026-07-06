"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingCart } from "lucide-react";
import { storefrontCheckoutFormSchema, type StorefrontCheckoutFormOnlyValues } from "@/lib/validations/storefront";
import { useCreateStorefrontOrder } from "@/hooks/use-storefront";
import { useStorefrontCartStore, cartTotal } from "@/store/storefront-cart.store";
import { formatCurrency } from "@/lib/utils";

export default function StoreCheckoutPage() {
  const router = useRouter();
  const items = useStorefrontCartStore((s) => s.items);
  const clear = useStorefrontCartStore((s) => s.clear);
  const createOrder = useCreateStorefrontOrder();

  // Generated once per checkout attempt — reused across retries so a
  // double-submit / network retry doesn't create a duplicate order.
  const clientReferenceId = useMemo(() => crypto.randomUUID(), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StorefrontCheckoutFormOnlyValues>({
    resolver: zodResolver(storefrontCheckoutFormSchema),
    defaultValues: {
      clientReferenceId,
      fullName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (items.length === 0) router.replace("/store/cart");
  }, [items.length, router]);

  if (items.length === 0) {
    return <EmptyState icon={ShoppingCart} title="Your cart is empty" />;
  }

  const subtotal = cartTotal(items);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await createOrder.mutateAsync({
        ...values,
        clientReferenceId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      clear();
      router.push(
        `/store/order-confirmation/${result.orderNumber}?phone=${encodeURIComponent(values.phone)}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    }
  });

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form onSubmit={onSubmit} className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Order Notes (optional)</Label>
            <Textarea id="notes" {...register("notes")} rows={3} />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting || createOrder.isPending}>
          Place Order
        </Button>
      </form>

      <div className="rounded-xl border bg-card p-5 shadow-card h-fit space-y-3">
        <h2 className="font-semibold">Order Summary</h2>
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {item.name} × {item.quantity}
            </span>
            <span className="tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Payment: Cash on delivery / in-store pickup.</p>
      </div>
    </div>
  );
}
