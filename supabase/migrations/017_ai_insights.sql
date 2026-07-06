-- ============================================================
-- Migration 017: AI / Business Intelligence RPCs
-- All SECURITY DEFINER, STABLE where side-effect free. Aggregation is
-- done via pre-filtered subqueries (not LEFT JOIN ... ON status filters)
-- so cancelled/refunded orders never leak into totals through fan-out —
-- worth calling out because the older get_top_categories /
-- get_best_selling_products RPCs (migration 007) use the LEFT-JOIN-with-
-- filter shape, which does not actually exclude cancelled/refunded rows
-- (the join condition failing leaves order_items unaffected). Not fixed
-- here — those functions are out of scope for this round — but flagged
-- so it isn't mistaken for intentional.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_inventory_history_product_action_created
  ON inventory_history(product_id, action, created_at DESC);

-- ─────────────────────────────────────────────
-- get_product_sales_velocity — reorder engine input
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_product_sales_velocity(p_days_back integer DEFAULT 30)
RETURNS TABLE(
  product_id          uuid,
  product_name        text,
  sku                 text,
  category_name       text,
  current_quantity    integer,
  low_stock_limit     integer,
  units_sold          bigint,
  avg_daily_velocity  numeric,
  days_until_stockout numeric
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    c.name AS category_name,
    p.quantity AS current_quantity,
    p.low_stock_limit,
    COALESCE(sales.units_sold, 0)::bigint AS units_sold,
    ROUND(COALESCE(sales.units_sold, 0)::numeric / p_days_back, 4) AS avg_daily_velocity,
    CASE
      WHEN COALESCE(sales.units_sold, 0) = 0 THEN NULL
      ELSE ROUND(p.quantity::numeric / (sales.units_sold::numeric / p_days_back), 1)
    END AS days_until_stockout
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN (
    SELECT oi.product_id, SUM(oi.quantity) AS units_sold
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('cancelled','refunded')
      AND o.created_at >= now() - (p_days_back || ' days')::interval
    GROUP BY oi.product_id
  ) sales ON sales.product_id = p.id
  WHERE p.status = 'active';
$$;

COMMENT ON FUNCTION get_product_sales_velocity(integer) IS
  'Per-active-product sales velocity over the trailing p_days_back days. days_until_stockout is NULL when a product has had zero sales in the window (nothing to divide by).';

GRANT EXECUTE ON FUNCTION get_product_sales_velocity(integer) TO authenticated;

-- ─────────────────────────────────────────────
-- get_stock_aging — dead/slow-moving inventory + Analytics "Stock Aging"
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_stock_aging(p_limit integer DEFAULT 50)
RETURNS TABLE(
  product_id           uuid,
  product_name         text,
  sku                  text,
  quantity             integer,
  last_sold_at         timestamptz,
  days_since_last_sale integer
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.quantity,
    last_sale.last_sold_at,
    CASE
      WHEN last_sale.last_sold_at IS NULL THEN EXTRACT(DAY FROM now() - p.created_at)::integer
      ELSE EXTRACT(DAY FROM now() - last_sale.last_sold_at)::integer
    END AS days_since_last_sale
  FROM products p
  LEFT JOIN (
    SELECT product_id, MAX(created_at) AS last_sold_at
    FROM inventory_history
    WHERE action = 'stock_out'
    GROUP BY product_id
  ) last_sale ON last_sale.product_id = p.id
  WHERE p.status = 'active' AND p.quantity > 0
  ORDER BY days_since_last_sale DESC NULLS FIRST
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_stock_aging(integer) IS
  'In-stock products ranked by time since last sale. Products never sold use their created_at as the baseline. Feeds both the Analytics Stock Aging view and the AI dead-inventory card.';

GRANT EXECUTE ON FUNCTION get_stock_aging(integer) TO authenticated;

-- ─────────────────────────────────────────────
-- get_product_growth / get_category_growth — period-over-period comparison
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_product_growth(
  p_current_from  timestamptz,
  p_current_to    timestamptz,
  p_previous_from timestamptz,
  p_previous_to   timestamptz,
  p_limit         integer DEFAULT 10
) RETURNS TABLE(
  product_id       uuid,
  product_name     text,
  sku              text,
  current_revenue  numeric,
  previous_revenue numeric,
  current_qty      bigint,
  previous_qty     bigint,
  growth_percent   numeric
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH current_period AS (
    SELECT oi.product_id, SUM(oi.total_price) AS revenue, SUM(oi.quantity) AS qty
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('cancelled','refunded')
      AND o.created_at >= p_current_from AND o.created_at < p_current_to
    GROUP BY oi.product_id
  ),
  previous_period AS (
    SELECT oi.product_id, SUM(oi.total_price) AS revenue, SUM(oi.quantity) AS qty
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('cancelled','refunded')
      AND o.created_at >= p_previous_from AND o.created_at < p_previous_to
    GROUP BY oi.product_id
  )
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    COALESCE(cp.revenue, 0) AS current_revenue,
    COALESCE(pp.revenue, 0) AS previous_revenue,
    COALESCE(cp.qty, 0) AS current_qty,
    COALESCE(pp.qty, 0) AS previous_qty,
    CASE
      WHEN COALESCE(pp.revenue, 0) = 0 THEN NULL
      ELSE ROUND(((COALESCE(cp.revenue, 0) - pp.revenue) / pp.revenue) * 100, 2)
    END AS growth_percent
  FROM products p
  JOIN current_period cp ON cp.product_id = p.id
  LEFT JOIN previous_period pp ON pp.product_id = p.id
  WHERE p.status = 'active'
  ORDER BY growth_percent DESC NULLS LAST, current_revenue DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_product_growth(timestamptz,timestamptz,timestamptz,timestamptz,integer) IS
  'Top products by revenue growth % between a current and previous period. growth_percent is NULL (not a divide-by-zero error) when the previous period had zero revenue for that product; such rows sort last.';

GRANT EXECUTE ON FUNCTION get_product_growth(timestamptz,timestamptz,timestamptz,timestamptz,integer) TO authenticated;

CREATE OR REPLACE FUNCTION get_category_growth(
  p_current_from  timestamptz,
  p_current_to    timestamptz,
  p_previous_from timestamptz,
  p_previous_to   timestamptz
) RETURNS TABLE(
  category_id      uuid,
  category_name    text,
  current_revenue  numeric,
  previous_revenue numeric,
  growth_percent    numeric
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH current_period AS (
    SELECT p.category_id, SUM(oi.total_price) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status NOT IN ('cancelled','refunded')
      AND o.created_at >= p_current_from AND o.created_at < p_current_to
    GROUP BY p.category_id
  ),
  previous_period AS (
    SELECT p.category_id, SUM(oi.total_price) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status NOT IN ('cancelled','refunded')
      AND o.created_at >= p_previous_from AND o.created_at < p_previous_to
    GROUP BY p.category_id
  )
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    COALESCE(cp.revenue, 0) AS current_revenue,
    COALESCE(pp.revenue, 0) AS previous_revenue,
    CASE
      WHEN COALESCE(pp.revenue, 0) = 0 THEN NULL
      ELSE ROUND(((COALESCE(cp.revenue, 0) - pp.revenue) / pp.revenue) * 100, 2)
    END AS growth_percent
  FROM categories c
  LEFT JOIN current_period cp ON cp.category_id = c.id
  LEFT JOIN previous_period pp ON pp.category_id = c.id
  WHERE c.status = 'active'
  ORDER BY growth_percent DESC NULLS LAST, current_revenue DESC;
$$;

COMMENT ON FUNCTION get_category_growth(timestamptz,timestamptz,timestamptz,timestamptz) IS
  'All active categories with current vs previous period revenue and growth %. Unlike get_product_growth this returns every category (not top-N) so a full performance table can be rendered.';

GRANT EXECUTE ON FUNCTION get_category_growth(timestamptz,timestamptz,timestamptz,timestamptz) TO authenticated;

-- ─────────────────────────────────────────────
-- get_top_brands — mirrors get_top_categories' output shape
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_top_brands(p_limit integer DEFAULT 8)
RETURNS TABLE(
  brand_id      uuid,
  brand_name    text,
  total_revenue numeric,
  product_count bigint,
  order_count   bigint
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH brand_sales AS (
    SELECT p.brand_id, SUM(oi.total_price) AS revenue, COUNT(DISTINCT oi.order_id) AS order_count
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled','refunded')
    JOIN products p ON p.id = oi.product_id
    GROUP BY p.brand_id
  )
  SELECT
    b.id AS brand_id,
    b.name AS brand_name,
    COALESCE(bs.revenue, 0) AS total_revenue,
    (SELECT COUNT(*) FROM products p2 WHERE p2.brand_id = b.id)::bigint AS product_count,
    COALESCE(bs.order_count, 0)::bigint AS order_count
  FROM brands b
  LEFT JOIN brand_sales bs ON bs.brand_id = b.id
  WHERE b.status = 'active'
  ORDER BY total_revenue DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_top_brands(integer) IS 'Top brands by revenue, mirroring get_top_categories output shape.';

GRANT EXECUTE ON FUNCTION get_top_brands(integer) TO authenticated;

-- ─────────────────────────────────────────────
-- get_profit_estimation(_by_category) — uses CURRENT purchase_price as a
-- cost proxy since order_items does not capture cost-at-time-of-sale.
-- Documented as an approximation in the UI, not presented as exact.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_profit_estimation(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(
  total_revenue            numeric,
  total_cost_estimate      numeric,
  estimated_profit         numeric,
  estimated_margin_percent numeric
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    COALESCE(SUM(oi.total_price), 0) AS total_revenue,
    COALESCE(SUM(p.purchase_price * oi.quantity), 0) AS total_cost_estimate,
    COALESCE(SUM(oi.total_price), 0) - COALESCE(SUM(p.purchase_price * oi.quantity), 0) AS estimated_profit,
    CASE WHEN COALESCE(SUM(oi.total_price), 0) = 0 THEN 0
      ELSE ROUND(((SUM(oi.total_price) - SUM(p.purchase_price * oi.quantity)) / SUM(oi.total_price)) * 100, 2)
    END AS estimated_margin_percent
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled','refunded')
  JOIN products p ON p.id = oi.product_id
  WHERE o.created_at >= p_from AND o.created_at <= p_to;
$$;

COMMENT ON FUNCTION get_profit_estimation(timestamptz,timestamptz) IS
  'Approximation only: cost is products.purchase_price (current) times historical quantity sold, not the cost actually in effect at sale time — order_items has no cost snapshot column. Present in UI as "estimated".';

GRANT EXECUTE ON FUNCTION get_profit_estimation(timestamptz,timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION get_profit_estimation_by_category(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(
  category_id     uuid,
  category_name   text,
  revenue         numeric,
  cost_estimate   numeric,
  profit_estimate numeric,
  margin_percent  numeric
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    COALESCE(SUM(oi.total_price), 0) AS revenue,
    COALESCE(SUM(p.purchase_price * oi.quantity), 0) AS cost_estimate,
    COALESCE(SUM(oi.total_price), 0) - COALESCE(SUM(p.purchase_price * oi.quantity), 0) AS profit_estimate,
    CASE WHEN COALESCE(SUM(oi.total_price), 0) = 0 THEN 0
      ELSE ROUND(((SUM(oi.total_price) - SUM(p.purchase_price * oi.quantity)) / SUM(oi.total_price)) * 100, 2)
    END AS margin_percent
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled','refunded')
  JOIN products p ON p.id = oi.product_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE o.created_at >= p_from AND o.created_at <= p_to
  GROUP BY c.id, c.name
  ORDER BY profit_estimate DESC;
$$;

GRANT EXECUTE ON FUNCTION get_profit_estimation_by_category(timestamptz,timestamptz) TO authenticated;

-- ─────────────────────────────────────────────
-- get_frequently_bought_together — co-purchase associations
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_frequently_bought_together(p_product_id uuid, p_limit integer DEFAULT 5)
RETURNS TABLE(
  product_id        uuid,
  product_name      text,
  sku               text,
  selling_price     numeric,
  co_purchase_count bigint
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.selling_price,
    COUNT(*)::bigint AS co_purchase_count
  FROM order_items oi1
  JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi2.product_id <> p_product_id
  JOIN products p ON p.id = oi2.product_id
  WHERE oi1.product_id = p_product_id AND p.status = 'active'
  GROUP BY p.id, p.name, p.sku, p.selling_price
  ORDER BY co_purchase_count DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_frequently_bought_together(uuid, integer) IS
  'Products most frequently co-occurring with p_product_id in the same order. Used for admin insights ("customers who bought X also bought Y") and storefront related-products (with a same-category fallback in the application layer when this returns few/no rows for a sparse dataset).';

GRANT EXECUTE ON FUNCTION get_frequently_bought_together(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_frequently_bought_together(uuid, integer) TO anon;

-- ─────────────────────────────────────────────
-- get_sales_heatmap — weekday x hour
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_sales_heatmap(p_days_back integer DEFAULT 90)
RETURNS TABLE(
  day_of_week integer,
  hour_of_day integer,
  order_count bigint,
  revenue     numeric
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    EXTRACT(DOW FROM created_at)::integer AS day_of_week,
    EXTRACT(HOUR FROM created_at)::integer AS hour_of_day,
    COUNT(*)::bigint AS order_count,
    COALESCE(SUM(grand_total), 0)::numeric AS revenue
  FROM orders
  WHERE created_at >= now() - (p_days_back || ' days')::interval
    AND status NOT IN ('cancelled','refunded')
  GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at);
$$;

COMMENT ON FUNCTION get_sales_heatmap(integer) IS
  'Order count/revenue bucketed by day-of-week (0=Sunday) and hour-of-day over the trailing p_days_back days.';

GRANT EXECUTE ON FUNCTION get_sales_heatmap(integer) TO authenticated;
