import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import type { OrderWithRelations } from "@/types/orders";
import type { ShopSettings } from "@/types/settings";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: { width: 48, height: 48, marginBottom: 6, objectFit: "contain" },
  shopName: { fontSize: 18, fontWeight: 700 },
  muted: { color: "#6b7280" },
  invoiceTitle: { fontSize: 18, fontWeight: 700, textAlign: "right" },
  orderNumber: { fontSize: 11, fontWeight: 700, textAlign: "right", marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 16 },
  twoCol: { flexDirection: "row", justifyContent: "space-between" },
  col: { width: "48%" },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  bold: { fontWeight: 700 },
  kvRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  table: { marginTop: 4 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
  },
  colProduct: { width: "40%" },
  colQty: { width: "15%", textAlign: "right" },
  colPrice: { width: "15%", textAlign: "right" },
  colDisc: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  th: { fontWeight: 700, fontSize: 9 },
  totalsBlock: { alignSelf: "flex-end", width: 220, marginTop: 12 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 6,
    marginTop: 4,
  },
  footer: { marginTop: 32, textAlign: "center", color: "#9ca3af", fontSize: 9 },
});

interface InvoicePdfProps {
  order: OrderWithRelations;
  settings: ShopSettings | null;
}

export function InvoicePdf({ order, settings }: InvoicePdfProps) {
  const shopName = settings?.shop_name ?? "ShopFlow";
  const addressParts = [settings?.shop_address, settings?.shop_city, settings?.shop_country].filter(
    Boolean
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {settings?.shop_logo_url && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={settings.shop_logo_url} style={styles.logo} />
            )}
            <Text style={styles.shopName}>{shopName}</Text>
            {addressParts.length > 0 && (
              <Text style={[styles.muted, { marginTop: 2 }]}>{addressParts.join(", ")}</Text>
            )}
            {settings?.shop_phone && <Text style={styles.muted}>{settings.shop_phone}</Text>}
            {settings?.shop_email && <Text style={styles.muted}>{settings.shop_email}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.orderNumber}>{order.order_number}</Text>
            <Text style={[styles.muted, { textAlign: "right", marginTop: 2 }]}>
              Date: {formatDate(order.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            {order.customer ? (
              <>
                <Text style={styles.bold}>{order.customer.full_name}</Text>
                {order.customer.email && <Text>{order.customer.email}</Text>}
                {order.customer.phone && <Text>{order.customer.phone}</Text>}
                {order.customer.address && <Text>{order.customer.address}</Text>}
              </>
            ) : (
              <Text style={styles.muted}>Walk-in Customer</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Payment Details</Text>
            <View style={styles.kvRow}>
              <Text style={styles.muted}>Method:</Text>
              <Text>{order.payment_method.replace("_", " ")}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.muted}>Status:</Text>
              <Text>{order.payment_status}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.muted}>Order Status:</Text>
              <Text>{order.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colProduct, styles.th]}>Product</Text>
            <Text style={[styles.colQty, styles.th]}>Qty</Text>
            <Text style={[styles.colPrice, styles.th]}>Unit Price</Text>
            <Text style={[styles.colDisc, styles.th]}>Disc %</Text>
            <Text style={[styles.colTotal, styles.th]}>Total</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.colProduct}>
                <Text>{item.product?.name ?? "Deleted product"}</Text>
                {item.product?.sku && (
                  <Text style={[styles.muted, { fontSize: 8, marginTop: 1 }]}>
                    SKU: {item.product.sku}
                  </Text>
                )}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colDisc}>
                {item.discount_percent > 0 ? `${item.discount_percent}%` : "-"}
              </Text>
              <Text style={[styles.colTotal, styles.bold]}>
                {formatCurrency(item.total_price)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{formatCurrency(order.subtotal)}</Text>
          </View>
          {order.discount_amount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Discount</Text>
              <Text>-{formatCurrency(order.discount_amount)}</Text>
            </View>
          )}
          {order.tax_amount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Tax</Text>
              <Text>+{formatCurrency(order.tax_amount)}</Text>
            </View>
          )}
          {order.shipping_amount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Shipping</Text>
              <Text>+{formatCurrency(order.shipping_amount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.bold}>Grand Total</Text>
            <Text style={styles.bold}>{formatCurrency(order.grand_total)}</Text>
          </View>
        </View>

        {order.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text>{order.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>Thank you for your business!</Text>
      </Page>
    </Document>
  );
}
