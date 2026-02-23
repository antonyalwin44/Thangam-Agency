import { supabase } from '../lib/supabase';
import { Order, OrderStatus } from '../types';

/**
 * Create new order
 */
export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string | null; error: any }> => {
    try {
        // 1. Insert into orders table
        // Build delivery address string — includes name & phone for admin visibility
        // (DB has no separate customer_name/phone columns, so we embed them here)
        const addressParts = [
            order.customerName ? `Name: ${order.customerName}` : null,
            order.customerPhone ? `Phone: ${order.customerPhone}` : null,
            `Address: ${order.deliveryLocation.address}`,
            order.deliveryLocation.landmark ? `Landmark: ${order.deliveryLocation.landmark}` : null,
        ].filter(Boolean).join('\n');

        const orderData: Record<string, any> = {
            customer_id: order.customerId,
            total_amount: order.totalAmount,
            status: 'pending', // DB stores lowercase
            delivery_address: addressParts,
            latitude: order.deliveryLocation.latitude || 0,
            longitude: order.deliveryLocation.longitude || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data: orderRow, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select('id')
            .single();

        if (orderError) {
            console.error('Order Insert Error:', orderError);
            return { id: null, error: orderError };
        }

        const orderId = orderRow.id;

        // 2. Insert into order_items table
        const itemsData = order.items.map(item => ({
            order_id: orderId,
            product_id: item.productId,
            quantity: item.quantity,
            price_at_time: item.pricePerUnit, // Required NOT NULL column in DB
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsData);

        if (itemsError) {
            console.error('Order Items Insert Error:', itemsError);
            // Optionally: Delete the order if items fail, or just return error
            return { id: orderId, error: itemsError };
        }

        return { id: orderId, error: null };
    } catch (error) {
        console.error('Unexpected error in createOrder:', error);
        return { id: null, error };
    }
};

/**
 * Helper: Convert a DB lowercase status to the TypeScript OrderStatus type
 */
const toOrderStatus = (dbStatus: string): OrderStatus => {
    // DB stores: 'pending', 'approved', 'loading', 'outfordelivery', 'delivered', 'cancelled'
    // TypeScript expects: 'Pending', 'Approved', 'Loading', 'OutForDelivery', 'Delivered', 'Cancelled'
    const map: Record<string, OrderStatus> = {
        'pending': 'Pending',
        'approved': 'Approved',
        'loading': 'Loading',
        'outfordelivery': 'OutForDelivery',
        'out_for_delivery': 'OutForDelivery',
        'out for delivery': 'OutForDelivery',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
    };
    return map[dbStatus?.toLowerCase()] ?? (dbStatus as OrderStatus);
};

/**
 * Helper: Map Supabase order row + items to Order type
 */
const mapSupabaseOrder = (data: any, items: any[] = []): Order => ({
    id: data.id,
    customerId: data.customer_id,
    customerName: data.customer?.name || data.customer_name || 'Customer',
    customerPhone: data.customer?.phone || data.customer_phone || '',
    driverId: data.driver_id,
    driverName: data.driver?.name || data.driver_name,
    items: items.map(item => ({
        productId: item.product_id,
        productName: item.products?.name || 'Unknown Product',
        quantity: item.quantity,
        unit: item.products?.unit_type || 'units',
        pricePerUnit: item.products?.price_per_unit || 0,
        totalPrice: (item.products?.price_per_unit || 0) * item.quantity,
    })),
    totalAmount: data.total_amount,
    status: toOrderStatus(data.status),
    deliveryLocation: {
        address: data.delivery_address || '',
        landmark: data.landmark || '', // Fallback for UI consistency
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
    },
    paymentMethod: 'COD', // Default if missing from DB
    notes: data.notes || '',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
});

/**
 * Get order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
            *,
            customer:users!customer_id(name),
            driver:users!driver_id(name)
        `)
        .eq('id', orderId)
        .single();

    if (orderError || !orderData) return null;

    const { data: itemsData } = await supabase
        .from('order_items')
        .select('*, products(name, price_per_unit, unit_type)')
        .eq('order_id', orderId);

    return mapSupabaseOrder(orderData, itemsData || []);
};

/**
 * Get orders by customer
 */
export const getOrdersByCustomer = async (customerId: string): Promise<Order[]> => {
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            customer:users!customer_id(name),
            driver:users!driver_id(name),
            order_items (
                *,
                products (name, price_per_unit, unit_type)
            )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching customer orders:', error);
        return [];
    }

    return orders.map(order => mapSupabaseOrder(order, order.order_items));
};

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = async (): Promise<Order[]> => {
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            customer:users!customer_id(name),
            driver:users!driver_id(name),
            order_items (
                *,
                products (name, price_per_unit, unit_type)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all orders:', error);
        return [];
    }

    return orders.map(order => mapSupabaseOrder(order, order.order_items));
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<{ error: any }> => {
    // Map TypeScript title-case status to DB lowercase value
    const dbStatus = status.toLowerCase().replace('outfordelivery', 'out_for_delivery');

    const { error } = await supabase
        .from('orders')
        .update({ status: dbStatus }) // Only update status; let DB trigger handle updated_at
        .eq('id', orderId);

    if (error) {
        console.error('updateOrderStatus error:', error);
    }

    return { error };
};

/**
 * Assign driver to order
 */
export const assignDriver = async (
    orderId: string,
    driverId: string,
    _driverName: string // Not stored in orders table
): Promise<{ error: any }> => {
    const { error } = await supabase
        .from('orders')
        .update({
            driver_id: driverId,
        })
        .eq('id', orderId);

    return { error };
};

/**
 * Update proof of delivery
 */
export const updateProofOfDelivery = async (orderId: string, _imageUrl: string): Promise<{ error: any }> => {
    // Note: proof_of_delivery column is missing, so we just update status
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'delivered',
        })
        .eq('id', orderId);

    return { error };
};

/**
 * Subscribe to orders in real-time
 */
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
    const channel = supabase
        .channel('public:orders')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            async () => {
                // Fetch fresh data on any change
                const orders = await getAllOrders();
                callback(orders);
            }
        )
        .subscribe();

    // Initial fetch
    getAllOrders().then(callback);

    return () => {
        supabase.removeChannel(channel);
    };
};

/**
 * Subscribe to customer orders in real-time
 */
export const subscribeToCustomerOrders = (
    customerId: string,
    callback: (orders: Order[]) => void
) => {
    const channel = supabase
        .channel(`public:orders:customer:${customerId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${customerId}` },
            async () => {
                const orders = await getOrdersByCustomer(customerId);
                callback(orders);
            }
        )
        .subscribe();

    // Initial fetch
    getOrdersByCustomer(customerId).then(callback);

    return () => {
        supabase.removeChannel(channel);
    };
};

// End of file

