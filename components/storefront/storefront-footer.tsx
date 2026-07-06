interface Props {
  shopName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export function StorefrontFooter({ shopName, address, phone, email }: Props) {
  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{shopName}</p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          {address && <span>{address}</span>}
          {phone && <span>{phone}</span>}
          {email && <span>{email}</span>}
        </div>
        <p className="mt-4 text-xs">
          © {new Date().getFullYear()} {shopName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
