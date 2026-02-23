import { create } from 'zustand';
import { CartItem, Product } from '../types';
import { calculatePrice } from '../utils/materialMath';

interface CartState {
    items: CartItem[];
    totalAmount: number;

    // Actions
    addItem: (product: Product, quantity: number, unit: string) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    calculateTotal: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    totalAmount: 0,

    addItem: (product, quantity, unit) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(item => item.product.id === product.id);

        const totalPrice = calculatePrice(
            quantity,
            product.pricePerUnit,
            product.bulkPrice,
            product.bulkThreshold
        );

        if (existingItemIndex >= 0) {
            // Update existing item
            const updatedItems = [...items];
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity,
                unit,
                totalPrice,
            };
            set({ items: updatedItems });
        } else {
            // Add new item
            set({
                items: [...items, { product, quantity, unit, totalPrice }]
            });
        }

        get().calculateTotal();
    },

    removeItem: (productId) => {
        set(state => ({
            items: state.items.filter(item => item.product.id !== productId)
        }));
        get().calculateTotal();
    },

    updateQuantity: (productId, quantity) => {
        const { items } = get();
        const updatedItems = items.map(item => {
            if (item.product.id === productId) {
                const totalPrice = calculatePrice(
                    quantity,
                    item.product.pricePerUnit,
                    item.product.bulkPrice,
                    item.product.bulkThreshold
                );
                return { ...item, quantity, totalPrice };
            }
            return item;
        });
        set({ items: updatedItems });
        get().calculateTotal();
    },

    clearCart: () => set({ items: [], totalAmount: 0 }),

    calculateTotal: () => {
        const { items } = get();
        const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
        set({ totalAmount: total });
    },
}));
