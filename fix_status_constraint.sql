-- ============================================================
-- BuildMate: Fix orders_status_check constraint
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Drop the old constraint (whatever values it had)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Recreate it with the correct lowercase values
-- These match what the app sends after the code fix
ALTER TABLE orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'pending',
    'approved',
    'loading',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ));

-- Step 3: Update any existing rows that have old/wrong status values
UPDATE orders SET status = 'pending'       WHERE status = 'Pending';
UPDATE orders SET status = 'approved'      WHERE status = 'Approved';
UPDATE orders SET status = 'loading'       WHERE status = 'Loading';
UPDATE orders SET status = 'out_for_delivery' WHERE status IN ('OutForDelivery', 'outfordelivery', 'Out For Delivery');
UPDATE orders SET status = 'delivered'     WHERE status = 'Delivered';
UPDATE orders SET status = 'cancelled'     WHERE status = 'Cancelled';

-- Done! The app should now be able to update orders without errors.
