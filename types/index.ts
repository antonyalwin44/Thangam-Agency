/**
 * TypeScript Type Definitions for BuildMate
 */

export type UserRole = 'admin' | 'customer' | 'driver';

export type OrderStatus = 'Pending' | 'Approved' | 'Loading' | 'OutForDelivery' | 'Delivered' | 'Cancelled';

export type MaterialCategory = 'Cement' | 'Steel' | 'Sand' | 'Bricks';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'COD';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    address?: string;
    createdAt: Date;
}

export interface Product {
    id: string;
    name: string;
    category: MaterialCategory;
    image?: string;
    basePrice: number;
    pricePerUnit: number;
    bulkPrice?: number;
    bulkThreshold?: number;
    currentStock: number;
    unitType: string; // e.g., "tons", "bags", "loads", "pieces"
    minOrderQuantity?: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice: number;
}

export interface DeliveryLocation {
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
}

export interface Order {
    id: string;
    customerId: string;
    customerName?: string;
    customerPhone?: string;
    driverId?: string;
    driverName?: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    deliveryLocation: DeliveryLocation;
    paymentMethod: PaymentMethod;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    approvedAt?: Date;
    deliveredAt?: Date;
    proofOfDelivery?: string; // Image URL
}

export interface CartItem {
    product: Product;
    quantity: number;
    unit: string;
    totalPrice: number;
}

export interface StockAdjustment {
    productId: string;
    adjustmentType: 'add' | 'remove' | 'set';
    quantity: number;
    reason?: string;
    performedBy: string;
    timestamp: Date;
}
