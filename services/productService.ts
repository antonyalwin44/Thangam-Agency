import { supabase } from '../lib/supabase';
import { Product, MaterialCategory } from '../types';

/**
 * Get all products
 */
export const getAllProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data.map(mapSupabaseProduct);
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (category: MaterialCategory): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('name');

    if (error) {
        console.error('Error fetching products by category:', error);
        return [];
    }

    return data.map(mapSupabaseProduct);
};

/**
 * Get single product
 */
export const getProduct = async (productId: string): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (error || !data) {
        console.error('Error fetching product:', error);
        return null;
    }

    return mapSupabaseProduct(data);
};

/**
 * Add new product
 */
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string | null; error: any }> => {
    const dbProduct = {
        name: productData.name,
        category: productData.category,
        base_price: productData.basePrice,
        price_per_unit: productData.pricePerUnit,
        current_stock: productData.currentStock,
        unit_type: productData.unitType,
        bulk_price: productData.bulkPrice,
        bulk_threshold: productData.bulkThreshold,
        image_url: productData.image,
        min_order_quantity: productData.minOrderQuantity,
        description: productData.description,
        created_at: new Date(),
        updated_at: new Date(),
    };

    const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

    if (error) {
        console.error('Error adding product:', error);
        return { id: null, error };
    }

    return { id: data.id, error: null };
};

/**
 * Update product
 */
export const updateProduct = async (
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<{ error: any }> => {
    const dbUpdates: any = {
        updated_at: new Date(),
    };

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.basePrice) dbUpdates.base_price = updates.basePrice;
    if (updates.pricePerUnit) dbUpdates.price_per_unit = updates.pricePerUnit;
    if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;
    if (updates.unitType) dbUpdates.unit_type = updates.unitType;
    if (updates.bulkPrice) dbUpdates.bulk_price = updates.bulkPrice;
    if (updates.bulkThreshold) dbUpdates.bulk_threshold = updates.bulkThreshold;
    if (updates.image) dbUpdates.image_url = updates.image;
    if (updates.minOrderQuantity) dbUpdates.min_order_quantity = updates.minOrderQuantity;
    if (updates.description) dbUpdates.description = updates.description;

    const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', productId);

    return { error };
};

/**
 * Delete product
 */
export const deleteProduct = async (productId: string): Promise<{ error: any }> => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    return { error };
};

/**
 * Update stock
 */
export const updateStock = async (productId: string, newStock: number): Promise<{ error: any }> => {
    const { error } = await supabase
        .from('products')
        .update({
            current_stock: newStock,
            updated_at: new Date(),
        })
        .eq('id', productId);

    return { error };
};

/**
 * Upload product image to Supabase Storage
 */
export const uploadProductImage = async (uri: string, productId: string): Promise<{ url: string | null; error: any }> => {
    try {
        // Convert URI to blob for web, or use file path for native
        const response = await fetch(uri);
        const blob = await response.blob();

        const fileExt = uri.split('.').pop() || 'jpg';
        const fileName = `${productId}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, blob, {
                contentType: `image/${fileExt}`,
                upsert: true
            });

        if (error) {
            console.error('Error uploading image:', error);
            return { url: null, error };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return { url: publicUrl, error: null };
    } catch (error) {
        console.error('Error in uploadProductImage:', error);
        return { url: null, error };
    }
};

/**
 * Delete product image from Supabase Storage
 */
export const deleteProductImage = async (imageUrl: string): Promise<{ error: any }> => {
    try {
        // Extract file path from URL
        const urlParts = imageUrl.split('/product-images/');
        if (urlParts.length < 2) {
            return { error: 'Invalid image URL' };
        }

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from('product-images')
            .remove([filePath]);

        if (error) {
            console.error('Error deleting image:', error);
            return { error };
        }

        return { error: null };
    } catch (error) {
        console.error('Error in deleteProductImage:', error);
        return { error };
    }
};

/**
 * Listen to products in real-time
 */
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
    const channel = supabase
        .channel('public:products')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            async () => {
                const products = await getAllProducts();
                callback(products);
            }
        )
        .subscribe();

    // Initial fetch
    getAllProducts().then(callback);

    return () => {
        supabase.removeChannel(channel);
    };
};

// Helper: Map Supabase snake_case to CamelCase
const mapSupabaseProduct = (data: any): Product => ({
    id: data.id,
    name: data.name,
    category: data.category,
    basePrice: data.base_price,
    pricePerUnit: data.price_per_unit,
    currentStock: data.current_stock,
    unitType: data.unit_type,
    bulkPrice: data.bulk_price,
    bulkThreshold: data.bulk_threshold,
    image: data.image_url,
    minOrderQuantity: data.min_order_quantity,
    description: data.description,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
});
