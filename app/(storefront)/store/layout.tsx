import { settingsService } from "@/services/settings.service";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await settingsService.getSettings().catch(() => null);
  const shopName = settings?.shop_name ?? "ShopFlow Store";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StorefrontHeader shopName={shopName} logoUrl={settings?.shop_logo_url ?? null} />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">{children}</div>
      </main>
      <StorefrontFooter
        shopName={shopName}
        address={settings?.shop_address ?? null}
        phone={settings?.shop_phone ?? null}
        email={settings?.shop_email ?? null}
      />
    </div>
  );
}
