-- ============================================================
-- 007: Analytics RPC Functions, Notifications Table & Triggers
-- ============================================================

-- ─────────────────────────────────────────────
-- NOTIFICATIONS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('low_stock','new_order','cancelled_order','refund_request','system')),
  title       text NOT NULL,
  message     text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  related_id  uuid,
  related_type text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read  ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role (triggers run as definer) to insert
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_notifications_updated_at();

-- ─────────────────────────────────────────────
-- HELPER: broadcast to all admin + manager users
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_admins_and_managers(
  p_type        text,
  p_title       text,
  p_message     text,
  p_related_id  uuid    DEFAULT NULL,
  p_related_type text   DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid;
BEGIN
  FOR v_user_id IN
    SELECT id FROM profiles WHERE role IN ('admin','manager') AND is_active = true
  LOOP
    INSERT INTO notifications(user_id, type, title, message, related_id, related_type)
    VALUES (v_user_id, p_type, p_title, p_message, p_related_id, p_related_type);
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────
-- TRIGGER: new order notification
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_new_order_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_customer_name text;
BEGIN
  SELECT full_name INTO v_customer_name FROM customers WHERE id = NEW.customer_id;
  PERFORM notify_admins_and_managers(
    'new_order',
    'New Order Received',
    'Order ' || NEW.order_number || COALESCE(' from ' || v_customer_name, '') || ' has been placed.',
    NEW.id,
    'order'
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_new_order_notification ON orders;
CREATE TRIGGER trg_new_order_notification
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION trigger_new_order_notification();

-- ─────────────────────────────────────────────
-- TRIGGER: order status change (cancelled / refunded)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_order_status_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('cancelled','refunded') THEN
    PERFORM notify_admins_and_managers(
      CASE NEW.status WHEN 'cancelled' THEN 'cancelled_order' ELSE 'refund_request' END,
      CASE NEW.status WHEN 'cancelled' THEN 'Order Cancelled' ELSE 'Refund Request' END,
      'Order ' || NEW.order_number || ' has been ' || NEW.status || '.',
      NEW.id,
      'order'
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_order_status_notification ON orders;
CREATE TRIGGER trg_order_status_notification
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION trigger_order_status_notification();

-- ─────────────────────────────────────────────
-- TRIGGER: low-stock alert
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_low_stock_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.quantity <= NEW.low_stock_limit
     AND (OLD IS NULL OR OLD.quantity > OLD.low_stock_limit)
     AND NEW.status = 'active'
  THEN
    PERFORM notify_admins_and_managers(
      'low_stock',
      'Low Stock Alert',
      '"' || NEW.name || '" is running low — only ' || NEW.quantity || ' unit(s) remaining.',
      NEW.id,
      'product'
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_low_stock_notification ON products;
CREATE TRIGGER trg_low_stock_notification
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_low_stock_notification();

-- ─────────────────────────────────────────────
-- ANALYTICS: Monthly Revenue (last N months)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_monthly_revenue(months_back integer DEFAULT 12)
RETURNS TABLE(
  period_label  text,
  period_start  timestamptz,
  revenue       numeric,
  order_count   bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    to_char(date_trunc('month', created_at), 'Mon YY') AS period_label,
    date_trunc('month', created_at)                    AS period_start,
    COALESCE(SUM(grand_total), 0)::numeric             AS revenue,
    COUNT(*)::bigint                                   AS order_count
  FROM orders
  WHERE created_at >= date_trunc('month', now()) - ((months_back - 1) || ' months')::interval
    AND status NOT IN ('cancelled','refunded')
  GROUP BY date_trunc('month', created_at)
  ORDER BY date_trunc('month', created_at);
$$;

-- ─────────────────────────────────────────────
-- ANALYTICS: Weekly Sales (last N weeks)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_weekly_sales(weeks_back integer DEFAULT 12)
RETURNS TABLE(
  period_label  text,
  period_start  timestamptz,
  revenue       numeric,
  order_count   bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    to_char(date_trunc('week', created_at), 'Mon DD') AS period_label,
    date_trunc('week', created_at)                    AS period_start,
    COALESCE(SUM(grand_total), 0)::numeric            AS revenue,
    COUNT(*)::bigint                                  AS order_count
  FROM orders
  WHERE created_at >= date_trunc('week', now()) - ((weeks_back - 1) || ' weeks')::interval
    AND status NOT IN ('cancelled','refunded')
  GROUP BY date_trunc('week', created_at)
  ORDER BY date_trunc('week', created_at);
$$;

-- ─────────────────────────────────────────────
-- ANALYTICS: Best Selling Products
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_best_selling_products(p_limit integer DEFAULT 10)
RETURNS TABLE(
  product_id    uuid,
  product_name  text,
  sku           text,
  category_name text,
  total_quantity bigint,
  total_revenue  numeric,
  order_count    bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id                                               AS product_id,
    p.name                                             AS product_name,
    p.sku,
    c.name                                             AS category_name,
    COALESCE(SUM(oi.quantity), 0)::bigint              AS total_quantity,
    COALESCE(SUM(oi.total_price), 0)::numeric          AS total_revenue,
    COUNT(DISTINCT oi.order_id)::bigint                AS order_count
  FROM products p
  LEFT JOIN categories c  ON p.category_id = c.id
  LEFT JOIN order_items oi ON p.id = oi.product_id
  LEFT JOIN orders o       ON oi.order_id = o.id AND o.status NOT IN ('cancelled','refunded')
  GROUP BY p.id, p.name, p.sku, c.name
  HAVING COALESCE(SUM(oi.quantity), 0) > 0
  ORDER BY total_quantity DESC
  LIMIT p_limit;
$$;

-- ─────────────────────────────────────────────
-- ANALYTICS: Top Categories by Revenue
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_top_categories(p_limit integer DEFAULT 8)
RETURNS TABLE(
  category_id    uuid,
  category_name  text,
  total_revenue  numeric,
  product_count  bigint,
  order_count    bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id                                         AS category_id,
    c.name                                       AS category_name,
    COALESCE(SUM(oi.total_price), 0)::numeric    AS total_revenue,
    COUNT(DISTINCT p.id)::bigint                 AS product_count,
    COUNT(DISTINCT oi.order_id)::bigint          AS order_count
  FROM categories c
  LEFT JOIN products p    ON c.id = p.category_id
  LEFT JOIN order_items oi ON p.id = oi.product_id
  LEFT JOIN orders o       ON oi.order_id = o.id AND o.status NOT IN ('cancelled','refunded')
  GROUP BY c.id, c.name
  ORDER BY total_revenue DESC
  LIMIT p_limit;
$$;

-- ─────────────────────────────────────────────
-- ANALYTICS: Top Customers by Spending
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_top_customers(p_limit integer DEFAULT 10)
RETURNS TABLE(
  customer_id     uuid,
  customer_name   text,
  email           text,
  total_orders    bigint,
  total_spending  numeric,
  last_order_date timestamptz
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id                                          AS customer_id,
    c.full_name                                   AS customer_name,
    c.email,
    COUNT(o.id)::bigint                           AS total_orders,
    COALESCE(SUM(o.grand_total), 0)::numeric      AS total_spending,
    MAX(o.created_at)                             AS last_order_date
  FROM customers c
  INNER JOIN orders o ON c.id = o.customer_id AND o.status NOT IN ('cancelled','refunded')
  GROUP BY c.id, c.full_name, c.email
  ORDER BY total_spending DESC
  LIMIT p_limit;
$$;

-- ─────────────────────────────────────────────
-- REPORTS: Sales report by period
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_sales_report(
  p_from      timestamptz DEFAULT now() - INTERVAL '30 days',
  p_to        timestamptz DEFAULT now(),
  p_group_by  text        DEFAULT 'day'   -- 'day' | 'week' | 'month' | 'year'
)
RETURNS TABLE(
  period_label     text,
  period_start     timestamptz,
  orders           bigint,
  revenue          numeric,
  avg_order_value  numeric,
  cancelled_orders bigint,
  refunded_orders  bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_group_by
      WHEN 'day'   THEN to_char(date_trunc('day',   created_at), 'Mon DD, YYYY')
      WHEN 'week'  THEN 'Week of ' || to_char(date_trunc('week', created_at), 'Mon DD')
      WHEN 'month' THEN to_char(date_trunc('month', created_at), 'Mon YYYY')
      WHEN 'year'  THEN to_char(date_trunc('year',  created_at), 'YYYY')
    END AS period_label,
    CASE p_group_by
      WHEN 'day'   THEN date_trunc('day',   created_at)
      WHEN 'week'  THEN date_trunc('week',  created_at)
      WHEN 'month' THEN date_trunc('month', created_at)
      WHEN 'year'  THEN date_trunc('year',  created_at)
    END AS period_start,
    COUNT(CASE WHEN status NOT IN ('cancelled','refunded') THEN 1 END)::bigint AS orders,
    COALESCE(SUM(CASE WHEN status NOT IN ('cancelled','refunded') THEN grand_total ELSE 0 END), 0)::numeric AS revenue,
    COALESCE(AVG(CASE WHEN status NOT IN ('cancelled','refunded') THEN grand_total END), 0)::numeric AS avg_order_value,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::bigint AS cancelled_orders,
    COUNT(CASE WHEN status = 'refunded'  THEN 1 END)::bigint AS refunded_orders
  FROM orders
  WHERE created_at >= p_from AND created_at <= p_to
  GROUP BY period_start
  ORDER BY period_start;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_monthly_revenue(integer)       TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_sales(integer)          TO authenticated;
GRANT EXECUTE ON FUNCTION get_best_selling_products(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_categories(integer)        TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_customers(integer)         TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_report(timestamptz, timestamptz, text) TO authenticated;
