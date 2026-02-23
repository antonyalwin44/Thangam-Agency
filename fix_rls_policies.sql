-- ============================================================
-- BuildMate: Fix Row Level Security (RLS) policies
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── order_items table ──────────────────────────────────────
DROP POLICY IF EXISTS "Customers can insert order items" ON order_items;
CREATE POLICY "Customers can insert order items"
ON order_items FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read order items" ON order_items;
CREATE POLICY "Users can read order items"
ON order_items FOR SELECT TO authenticated USING (true);

-- ─── orders table ───────────────────────────────────────────
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
CREATE POLICY "Customers can create orders"
ON orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can read orders" ON orders;
CREATE POLICY "Users can read orders"
ON orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update orders" ON orders;
CREATE POLICY "Users can update orders"
ON orders FOR UPDATE TO authenticated USING (true);
