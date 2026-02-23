import { create } from 'zustand';
import { Product } from '../types';

interface ProductState {
    products: Product[];
    isLoading: boolean;
    error: string | null;

    // Actions
    setProducts: (products: Product[]) => void;
    addProduct: (product: Product) => void;
    updateProduct: (productId: string, updates: Partial<Product>) => void;
    deleteProduct: (productId: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useProductStore = create<ProductState>((set) => ({
    products: [],
    isLoading: false,
    error: null,

    setProducts: (products) => set({ products, error: null }),

    addProduct: (product) => set((state) => ({
        products: [...state.products, product],
    })),

    updateProduct: (productId, updates) => set((state) => ({
        products: state.products.map((p) =>
            p.id === productId ? { ...p, ...updates, updatedAt: new Date() } : p
        ),
    })),

    deleteProduct: (productId) => set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
    })),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),
}));
