import { create } from 'zustand';
import { Order, OrderStatus } from '../types';

interface OrderState {
    orders: Order[];
    isLoading: boolean;
    error: string | null;

    // Actions
    setOrders: (orders: Order[]) => void;
    addOrder: (order: Order) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    assignDriver: (orderId: string, driverId: string, driverName: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
    orders: [],
    isLoading: false,
    error: null,

    setOrders: (orders) => set({ orders, error: null }),

    addOrder: (order) => set((state) => ({
        orders: [...state.orders, order],
    })),

    updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map((order) =>
            order.id === orderId
                ? {
                    ...order,
                    status,
                    updatedAt: new Date(),
                    ...(status === 'Delivered' && { deliveredAt: new Date() }),
                    ...(status === 'Approved' && { approvedAt: new Date() })
                }
                : order
        ),
    })),

    assignDriver: (orderId, driverId, driverName) => set((state) => ({
        orders: state.orders.map((order) =>
            order.id === orderId
                ? { ...order, driverId, driverName, updatedAt: new Date() }
                : order
        ),
    })),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),
}));
