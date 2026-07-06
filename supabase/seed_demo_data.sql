-- ============================================================
-- CLEANUP FIRST — removes all previously seeded demo data (products,
-- customers, orders, employees, suppliers, purchase orders, returns,
-- notifications, activity/login history). Run this block BEFORE the
-- seed blocks below whenever you re-run this file.
-- Safe: only touches rows tagged as seed data, never your real data.
-- Order matters (FK constraints): orders before purchase_orders before
-- products before customers/suppliers/employees.
-- ============================================================
DELETE FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE notes = 'DEMO SEED DATA');
DELETE FROM purchase_orders WHERE supplier_id IN (SELECT id FROM suppliers WHERE notes = 'DEMO SEED DATA');
DELETE FROM products WHERE tags @> ARRAY['demo-seed'];
DELETE FROM customers WHERE notes = 'DEMO SEED DATA';
DELETE FROM suppliers WHERE notes = 'DEMO SEED DATA';
DELETE FROM employees WHERE email LIKE '%@shopflow-demo.pk';
DELETE FROM notifications WHERE message IN ('A demo product is running low on stock.', 'A new demo order has been placed.', 'Demo data seeded successfully.');
DELETE FROM activity_logs WHERE description LIKE 'Demo activity log entry #%';
DELETE FROM login_history WHERE user_agent = 'Demo Seed Browser';

-- ============================================================
-- Demo Seed Data — for presentation/demo purposes
-- ============================================================
-- Run this ONLY after migrations 001-018 have all been applied,
-- and AFTER the cleanup block above.
-- NOT idempotent — running the seed block twice creates duplicates.
--
-- What it creates:
--   - 80 products with real, category-appropriate names (Electronics,
--     Clothing, Food, Home & Garden, Sports, Beauty, Books, Toys,
--     Automotive, Health) across your existing categories/brands
--   - 50 customers with realistic full names
--   - ~100 days of historical orders (weighted toward recent days
--     and weekends/afternoons) with realistic status mix, so the
--     AI forecasting/growth/heatmap/reorder features have enough
--     history to show real numbers instead of "not enough data yet"
--   - matching inventory_history entries (stock aging needs these)
--   - a handful of notifications + activity log entries so those
--     screens aren't empty before your first live action
--
-- Cleanup: re-run the DELETE block at the top of this file whenever
-- you want to wipe the demo data back out.
-- ============================================================

DO $$
DECLARE
  v_category_ids   uuid[];
  v_brand_ids      uuid[];
  v_product_ids    uuid[];
  v_customer_ids   uuid[];
  v_admin_id       uuid;
  v_days_back      int := 100;

  v_cat_id         uuid;
  v_cat_prefix     text;
  v_names          text[];
  v_name           text;
  v_sku_counter    int := 0;

  v_product_id     uuid;
  v_customer_id    uuid;
  v_order_id       uuid;
  v_order_number   text;
  v_order_date     timestamptz;
  v_day            int;
  v_orders_today   int;
  v_i              int;
  v_j              int;
  v_k              int;
  v_num_items      int;
  v_item_product_id uuid;
  v_item_qty        int;
  v_item_price      numeric;
  v_item_total      numeric;
  v_subtotal        numeric;
  v_tax             numeric;
  v_grand_total     numeric;
  v_status          text;
  v_payment_status  text;
  v_payment_method  text;
  v_hour            int;
  v_weekday_bias    numeric;
  v_current_qty     integer;
  v_new_qty         integer;

  v_customer_names text[] := ARRAY[
    'Ahmed Khan','Ayesha Malik','Bilal Sheikh','Fatima Raza','Hassan Iqbal',
    'Sana Tariq','Usman Ali','Zainab Hussain','Imran Sheikh','Mariam Farooq',
    'Ali Raza','Sadia Nawaz','Kamran Yousaf','Nida Aslam','Faisal Mahmood',
    'Hira Siddiqui','Adnan Qureshi','Rabia Chaudhry','Omar Farooqi','Sobia Riaz',
    'Waqas Ahmed','Amna Javed','Tariq Mehmood','Sidra Aziz','Junaid Akhtar',
    'Mehak Naeem','Shahzad Iqbal','Rimsha Khalid','Asad Butt','Iqra Yousuf',
    'Naveed Anwar','Sundas Rafiq','Faizan Shah','Anum Bashir','Rizwan Haider',
    'Komal Zafar','Shoaib Akram','Saba Latif','Zeeshan Baig','Uzma Rehman',
    'Danish Malik','Farah Deen','Awais Ashraf','Hina Sultana','Sohail Rana',
    'Nimra Waseem','Arslan Nadeem','Maryam Ashfaq','Yasir Hameed','Laiba Saeed'
  ];
BEGIN
  SELECT array_agg(id) INTO v_brand_ids FROM brands WHERE status = 'active';
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

  IF v_brand_ids IS NULL THEN
    RAISE EXCEPTION 'No active brands found — make sure migration 003''s seed data exists first';
  END IF;

  -- ---------------------------------------------------
  -- 1) Products — real, category-appropriate names. Generous starting
  --    stock; ~100 days of simulated sales below naturally deplete some
  --    to low/zero stock (reorder demo) while others stay healthy
  --    (dead-stock demo) — no hardcoded buckets needed.
  -- ---------------------------------------------------
  FOR v_cat_prefix, v_names IN
    SELECT * FROM (VALUES
      ('electronics',            ARRAY['Wireless Bluetooth Headphones','65W USB-C Fast Charger','Portable Power Bank 20000mAh','Smart LED Bulb','Bluetooth Speaker','Wireless Mouse','Mechanical Keyboard','Noise Cancelling Earbuds']),
      ('clothing-apparel',       ARRAY['Men''s Cotton T-Shirt','Women''s Denim Jacket','Slim Fit Jeans','Casual Polo Shirt','Formal Dress Shirt','Winter Hoodie','Leather Belt','Woolen Scarf']),
      ('food-beverages',         ARRAY['Basmati Rice 5kg','Organic Honey Jar','Green Tea Box','Roasted Almonds Pack','Extra Virgin Olive Oil','Instant Coffee Jar','Dried Dates Pack','Chocolate Cookies Box']),
      ('home-garden',            ARRAY['Non-Stick Cooking Pan','Ceramic Dinner Set','LED Table Lamp','Cotton Bedsheet Set','Storage Basket Set','Wall Clock','Kitchen Knife Set','Bathroom Towel Set']),
      ('sports-outdoors',        ARRAY['Yoga Mat','Football','Adjustable Dumbbell Set','Cricket Bat','Running Shoes','Cycling Helmet','Water Bottle 1L','Hiking Backpack']),
      ('beauty-personal-care',   ARRAY['Face Moisturizer Cream','Herbal Shampoo','Anti-Dandruff Conditioner','Sunscreen SPF 50','Body Lotion','Perfume 100ml','Face Wash','Electric Shaver']),
      ('books-media',            ARRAY['Bestselling Novel','Kids Story Book Set','Self-Help Book','Cookbook Collection','Notebook Pack','Motivational Journal','Comic Book Set','Puzzle Book']),
      ('toys-games',             ARRAY['Remote Control Car','Building Blocks Set','Board Game Classic','Stuffed Teddy Bear','Puzzle 1000 Pieces','Action Figure Set','Kids Drawing Kit','Doll House']),
      ('automotive',             ARRAY['Car Air Freshener','Microfiber Cleaning Cloth Set','Car Phone Mount','Tire Pressure Gauge','Car Vacuum Cleaner','Car Seat Cover Set','LED Headlight Bulb','Car Charger Dual USB']),
      ('health-wellness',        ARRAY['Multivitamin Tablets','Digital Thermometer','Blood Pressure Monitor','First Aid Kit','Protein Powder Jar','Hand Sanitizer Pack','Digital Weighing Scale','Vitamin C Tablets'])
    ) AS t(prefix, names)
  LOOP
    SELECT id INTO v_cat_id FROM categories WHERE slug = v_cat_prefix;
    IF v_cat_id IS NULL THEN
      CONTINUE;
    END IF;

    FOREACH v_name IN ARRAY v_names LOOP
      v_sku_counter := v_sku_counter + 1;

      INSERT INTO products (
        name, description, sku, barcode, category_id, brand_id,
        purchase_price, selling_price, quantity, low_stock_limit,
        status, is_featured, tags, created_at
      ) VALUES (
        v_name,
        v_name || ' — quality product for everyday use.',
        upper(left(v_cat_prefix, 4)) || '-' || LPAD(v_sku_counter::text, 5, '0'),
        LPAD((1000000000000 + v_sku_counter)::text, 13, '0'),
        v_cat_id,
        v_brand_ids[1 + floor(random() * array_length(v_brand_ids, 1))::int],
        round((random() * 40 + 10)::numeric, 2),
        round((random() * 150 + 30)::numeric, 2),
        (random() * 250 + 100)::int,
        10,
        'active',
        (v_sku_counter % 12 = 0),
        ARRAY['demo-seed'],
        now() - ((random() * 60)::int || ' days')::interval
      )
      RETURNING id INTO v_product_id;

      v_product_ids := array_append(v_product_ids, v_product_id);
    END LOOP;
  END LOOP;

  -- ---------------------------------------------------
  -- 2) Customers
  -- ---------------------------------------------------
  FOR v_i IN 1..array_length(v_customer_names, 1) LOOP
    INSERT INTO customers (full_name, email, phone, address, city, country, notes)
    VALUES (
      v_customer_names[v_i],
      lower(replace(v_customer_names[v_i], ' ', '.')) || v_i || '@example.com',
      '03' || LPAD((100000000 + v_i)::text, 9, '0'),
      v_i || ' Sample Street',
      (ARRAY['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Multan'])[1 + (v_i % 5)],
      'PK',
      'DEMO SEED DATA'
    )
    RETURNING id INTO v_customer_id;

    v_customer_ids := array_append(v_customer_ids, v_customer_id);
  END LOOP;

  -- ---------------------------------------------------
  -- 3) Historical orders, oldest to newest, so stock depletes
  --    chronologically and inventory_history stays consistent.
  -- ---------------------------------------------------
  FOR v_day IN REVERSE v_days_back..0 LOOP
    v_orders_today := 1 + floor(random() * 3 + (v_days_back - v_day)::numeric / v_days_back * 4)::int;
    v_weekday_bias := CASE
      WHEN EXTRACT(DOW FROM (now() - (v_day || ' days')::interval)) IN (5, 6) THEN 1.4
      ELSE 1.0
    END;
    v_orders_today := GREATEST(1, round(v_orders_today * v_weekday_bias)::int);

    FOR v_j IN 1..v_orders_today LOOP
      v_hour := 10 + floor(random() * 12)::int;
      v_order_date := date_trunc('day', now() - (v_day || ' days')::interval)
        + (v_hour || ' hours')::interval
        + (floor(random() * 60) || ' minutes')::interval;

      v_customer_id := v_customer_ids[1 + floor(random() * array_length(v_customer_ids, 1))::int];

      v_status := CASE
        WHEN v_day < 3 THEN (ARRAY['pending', 'confirmed', 'processing'])[1 + floor(random() * 3)::int]
        WHEN random() < 0.05 THEN 'cancelled'
        WHEN random() < 0.03 THEN 'refunded'
        ELSE 'delivered'
      END;
      v_payment_status := CASE
        WHEN v_status = 'cancelled' THEN 'unpaid'
        WHEN v_status = 'refunded' THEN 'refunded'
        ELSE 'paid'
      END;
      v_payment_method := (ARRAY['cash', 'card', 'bank_transfer'])[1 + floor(random() * 3)::int];

      v_order_number := 'ORD-' || to_char(v_order_date, 'YYYYMMDD') || '-' ||
        LPAD(nextval('order_number_seq')::text, 4, '0');

      INSERT INTO orders (
        order_number, customer_id, status, payment_method, payment_status,
        subtotal, discount_amount, tax_amount, shipping_amount, grand_total,
        created_at, updated_at
      ) VALUES (
        v_order_number, v_customer_id, v_status, v_payment_method, v_payment_status,
        0, 0, 0, 0, 0, v_order_date, v_order_date
      ) RETURNING id INTO v_order_id;

      v_subtotal := 0;
      v_num_items := 1 + floor(random() * 4)::int;

      FOR v_k IN 1..v_num_items LOOP
        v_item_product_id := v_product_ids[1 + floor(random() * array_length(v_product_ids, 1))::int];

        SELECT quantity INTO v_current_qty FROM products WHERE id = v_item_product_id;
        IF v_current_qty <= 0 THEN
          v_item_product_id := v_product_ids[1 + floor(random() * array_length(v_product_ids, 1))::int];
          SELECT quantity INTO v_current_qty FROM products WHERE id = v_item_product_id;
          IF v_current_qty <= 0 THEN
            CONTINUE;
          END IF;
        END IF;

        SELECT selling_price INTO v_item_price FROM products WHERE id = v_item_product_id;
        v_item_qty := LEAST(v_current_qty, 1 + floor(random() * 3)::int);
        v_item_total := v_item_price * v_item_qty;
        v_subtotal := v_subtotal + v_item_total;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount_percent, total_price, created_at)
        VALUES (v_order_id, v_item_product_id, v_item_qty, v_item_price, 0, v_item_total, v_order_date);

        IF v_status <> 'cancelled' THEN
          v_new_qty := GREATEST(v_current_qty - v_item_qty, 0);

          UPDATE products SET quantity = v_new_qty, updated_at = v_order_date
          WHERE id = v_item_product_id;

          INSERT INTO inventory_history (
            product_id, user_id, action, previous_quantity, updated_quantity,
            quantity_change, notes, created_at
          ) VALUES (
            v_item_product_id, v_admin_id, 'stock_out', v_current_qty, v_new_qty,
            -v_item_qty, 'Demo seed order: ' || v_order_number, v_order_date
          );
        END IF;
      END LOOP;

      v_tax := round(v_subtotal * 0.05, 2);
      v_grand_total := v_subtotal + v_tax;

      UPDATE orders SET subtotal = v_subtotal, tax_amount = v_tax, grand_total = v_grand_total
      WHERE id = v_order_id;

      IF v_payment_status = 'paid' THEN
        INSERT INTO payments (order_id, amount, payment_method, payment_date)
        VALUES (v_order_id, v_grand_total, v_payment_method, v_order_date);
      END IF;
    END LOOP;
  END LOOP;

  -- ---------------------------------------------------
  -- 4) A handful of notifications + activity log entries so
  --    those screens have content before your first live demo action.
  -- ---------------------------------------------------
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, created_at, read)
    SELECT
      v_admin_id,
      (ARRAY['low_stock', 'new_order', 'system'])[1 + (n % 3)],
      CASE (n % 3)
        WHEN 0 THEN 'Low Stock Alert'
        WHEN 1 THEN 'New Order Received'
        ELSE 'System Notice'
      END,
      CASE (n % 3)
        WHEN 0 THEN 'A demo product is running low on stock.'
        WHEN 1 THEN 'A new demo order has been placed.'
        ELSE 'Demo data seeded successfully.'
      END,
      now() - (n || ' hours')::interval,
      (n > 3)
    FROM generate_series(1, 8) AS n;

    INSERT INTO activity_logs (user_id, user_name, action, resource, description, created_at)
    SELECT
      v_admin_id,
      'Admin',
      (ARRAY['create', 'update', 'stock_in', 'stock_out', 'view'])[1 + (n % 5)],
      (ARRAY['product', 'order', 'inventory', 'customer'])[1 + (n % 4)],
      'Demo activity log entry #' || n,
      now() - (n || ' hours')::interval
    FROM generate_series(1, 15) AS n;
  END IF;

  RAISE NOTICE 'Seed complete: % products, % customers seeded.',
    array_length(v_product_ids, 1), array_length(v_customer_ids, 1);
END $$;

-- ============================================================
-- Additional Demo Seed — Employees, Suppliers, Purchase Orders, Returns
-- ============================================================
-- Run AFTER the seed block above (needs the demo products/orders it
-- creates). Uses the real create_purchase_order_transaction /
-- receive_purchase_order_transaction / process_return_transaction RPCs
-- instead of raw inserts, so stock/inventory_history/payment side
-- effects stay consistent with what the app itself would do.

DO $$
DECLARE
  v_admin_id      uuid;
  v_product_ids   uuid[];
  v_supplier_ids  uuid[];
  v_supplier_id   uuid;
  v_po_id         uuid;
  v_po_items      jsonb;
  v_i             int;
  v_n             int;
  v_return_order  record;
  v_return_qty    int;
  v_reason        text;

  v_employee_names text[] := ARRAY[
    'Bilal Ahmed','Sana Khalid','Usman Tariq','Ayesha Noor','Hamza Sheikh',
    'Fatima Zahra','Ali Hassan','Mahnoor Ijaz','Zain Abbas','Komal Farooq'
  ];
  v_employee_roles text[] := ARRAY[
    'manager','staff','staff','staff','manager','staff','staff','staff','staff','staff'
  ];

  v_supplier_names text[] := ARRAY[
    'Al-Noor Electronics Distributors','Karachi Textile Traders','Lahore Grocery Wholesalers',
    'Premium Home Essentials Co.','Elite Sports Gear Suppliers','Beauty World Distributors',
    'National Book Depot'
  ];
  v_supplier_contacts text[] := ARRAY[
    'Tariq Mehmood','Rabia Chaudhry','Naveed Anwar','Shoaib Akram','Danish Malik','Sundas Rafiq','Rizwan Haider'
  ];

  v_return_reasons text[] := ARRAY[
    'Item damaged during delivery','Wrong item received','Changed my mind',
    'Product defective on arrival','Size/fit not as expected'
  ];
BEGIN
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  SELECT array_agg(id) INTO v_product_ids FROM products WHERE tags @> ARRAY['demo-seed'];

  IF v_product_ids IS NULL THEN
    RAISE EXCEPTION 'No demo products found — run the product/order seed block above first';
  END IF;

  -- ---------------------------------------------------
  -- 1) Employees
  -- ---------------------------------------------------
  FOR v_i IN 1..array_length(v_employee_names, 1) LOOP
    INSERT INTO employees (full_name, email, phone, role, status)
    VALUES (
      v_employee_names[v_i],
      lower(replace(v_employee_names[v_i], ' ', '.')) || '@shopflow-demo.pk',
      '03' || LPAD((200000000 + v_i)::text, 9, '0'),
      v_employee_roles[v_i],
      CASE WHEN v_i = array_length(v_employee_names, 1) THEN 'on_leave' ELSE 'active' END
    );
  END LOOP;

  -- ---------------------------------------------------
  -- 2) Suppliers
  -- ---------------------------------------------------
  FOR v_i IN 1..array_length(v_supplier_names, 1) LOOP
    INSERT INTO suppliers (name, contact_name, email, phone, address, city, country, notes, status)
    VALUES (
      v_supplier_names[v_i],
      v_supplier_contacts[v_i],
      lower(replace(v_supplier_names[v_i], ' ', '')) || '@supplier-demo.pk',
      '021' || LPAD((3000000 + v_i)::text, 7, '0'),
      v_i || ' Industrial Area',
      (ARRAY['Karachi', 'Lahore', 'Faisalabad'])[1 + (v_i % 3)],
      'PK',
      'DEMO SEED DATA',
      'active'
    )
    RETURNING id INTO v_supplier_id;

    v_supplier_ids := array_append(v_supplier_ids, v_supplier_id);
  END LOOP;

  -- ---------------------------------------------------
  -- 3) Purchase Orders — most received (backdated, for restocking
  --    history), a couple left pending so you can demo "Receive
  --    Purchase Order" live.
  -- ---------------------------------------------------
  FOR v_i IN 1..array_length(v_supplier_ids, 1) LOOP
    v_po_items := (
      SELECT jsonb_agg(jsonb_build_object(
        'product_id', p.id,
        'quantity', 20 + floor(random() * 60)::int,
        'unit_cost', round((p.purchase_price * (0.9 + random() * 0.2))::numeric, 2)
      ))
      FROM (
        SELECT DISTINCT v_product_ids[1 + floor(random() * array_length(v_product_ids, 1))::int] AS pid
        FROM generate_series(1, 3)
      ) picks
      JOIN products p ON p.id = picks.pid
    );

    SELECT create_purchase_order_transaction(v_supplier_ids[v_i], v_po_items, 'Restock order', v_admin_id)
    INTO v_po_id;

    IF v_i <= array_length(v_supplier_ids, 1) - 2 THEN
      PERFORM receive_purchase_order_transaction(v_po_id, v_admin_id);
      UPDATE purchase_orders
      SET created_at = now() - ((5 + v_i * 4) || ' days')::interval,
          received_at = now() - ((3 + v_i * 4) || ' days')::interval,
          updated_at = now() - ((3 + v_i * 4) || ' days')::interval
      WHERE id = v_po_id;
    END IF;
    -- else: leave as 'pending', created just now — demo-able live
  END LOOP;

  -- ---------------------------------------------------
  -- 4) Returns — partially return one item on a handful of already-
  --    delivered demo orders, via the real return RPC (handles
  --    proration, restocking, and the refund payment automatically).
  -- ---------------------------------------------------
  v_n := 0;
  FOR v_return_order IN
    SELECT o.id AS order_id, oi.id AS order_item_id, oi.quantity AS qty
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id IN (SELECT id FROM customers WHERE notes = 'DEMO SEED DATA')
      AND o.status = 'delivered'
    ORDER BY random()
    LIMIT 8
  LOOP
    v_n := v_n + 1;
    v_return_qty := LEAST(v_return_order.qty, 1 + floor(random() * 2)::int);
    v_reason := v_return_reasons[1 + (v_n % array_length(v_return_reasons, 1))];

    PERFORM process_return_transaction(
      v_return_order.order_id,
      jsonb_build_array(jsonb_build_object('order_item_id', v_return_order.order_item_id, 'quantity', v_return_qty)),
      v_reason,
      'cash',
      v_admin_id
    );
  END LOOP;

  -- ---------------------------------------------------
  -- 5) Login history — a few backdated entries for every real
  --    profile that exists (admin/manager/staff you actually created).
  -- ---------------------------------------------------
  INSERT INTO login_history (user_id, ip_address, user_agent, status, created_at)
  SELECT p.id, '192.168.1.' || (10 + n), 'Demo Seed Browser', 'success', now() - (n || ' hours')::interval
  FROM profiles p, generate_series(1, 3) AS n;

  RAISE NOTICE 'Additional seed complete: % employees, % suppliers, % purchase orders, % returns.',
    array_length(v_employee_names, 1), array_length(v_supplier_ids, 1), array_length(v_supplier_ids, 1), v_n;
END $$;
