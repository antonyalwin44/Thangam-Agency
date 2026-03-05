import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    TextInput,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { subscribeToProducts } from '../../services/productService';
import { Product, MaterialCategory } from '../../types';
import { formatCurrency } from '../../utils/materialMath';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CustomerHome() {
    const router = useRouter();
    const { products, setProducts, setLoading, isLoading } = useProductStore();
    const { addItem } = useCartStore();
    const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const [currBannerIndex, setCurrBannerIndex] = useState(0);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToProducts((fetchedProducts) => {
            setProducts(fetchedProducts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);



    const handleScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / SCREEN_WIDTH);
        setCurrBannerIndex(index);
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const inStock = product.currentStock > 0;
        return matchesSearch && matchesCategory && inStock;
    });

    // Get featured products for carousel
    const featuredCategories: { category: MaterialCategory; color: string; label: string }[] = [
        { category: 'Steel', color: '#FF6B00', label: "Today's Steel Price" },
        { category: 'Cement', color: '#8B5CF6', label: "Today's Cement Price" },
        { category: 'Bricks', color: '#EF4444', label: "Today's Bricks Price" },
    ];

    const featuredProducts = featuredCategories.map(cat => {
        const product = products
            .filter((p) => p.category === cat.category && p.currentStock > 0)
            .sort((a, b) => b.pricePerUnit - a.pricePerUnit)[0];

        return product ? { ...product, ...cat } : null;
    }).filter((item): item is Product & { color: string; label: string } => item !== null);

    // Auto-scroll banner
    useEffect(() => {
        if (featuredProducts.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (currBannerIndex + 1) % featuredProducts.length;
            setCurrBannerIndex(nextIndex);
            scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
        }, 3000);

        return () => clearInterval(interval);
    }, [currBannerIndex, featuredProducts.length]);

    const categories: Array<{ name: MaterialCategory | 'All'; icon: string; color: string }> = [
        { name: 'All', icon: '🏗️', color: '#FF6B00' },
        { name: 'Cement', icon: '🏭', color: '#8B5CF6' },
        { name: 'Steel', icon: '⚙️', color: '#3B82F6' },
        { name: 'Sand', icon: '🏖️', color: '#F59E0B' },
        { name: 'Bricks', icon: '🧱', color: '#EF4444' },
    ];

    return (
        <View style={styles.container}>
            {/* Live Price Banner Carousel */}
            {featuredProducts.length > 0 && (
                <View>
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal={true}
                        pagingEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        style={styles.bannerContainer}
                        onMomentumScrollEnd={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {featuredProducts.map((item) => (
                            <View key={item.id} style={[styles.banner, { backgroundColor: item.color, width: SCREEN_WIDTH }]}>
                                <View style={styles.bannerContent}>
                                    <Text style={styles.bannerTitle}>{item.label}</Text>
                                    <Text style={styles.bannerPrice}>
                                        {formatCurrency(item.pricePerUnit)}/{item.unitType}
                                    </Text>
                                </View>
                                <View style={styles.bannerBadge}>
                                    <Text style={[styles.bannerBadgeText, { color: item.color }]}>LIVE</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    {/* Dots Indicator */}
                    {featuredProducts.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {featuredProducts.map((_, index) => (
                                <View key={index} style={styles.dot} />
                            ))}
                        </View>
                    )}
                </View>
            )}

            <ScrollView style={styles.content}>

                {/* Stock Check Button */}
                <TouchableOpacity
                    style={styles.stockCheckButton}
                    onPress={() => router.push('/(customer)/stock')}
                >
                    <Text style={styles.stockCheckIcon}>📊</Text>
                    <Text style={styles.stockCheckText}>Check Stock Availability</Text>
                </TouchableOpacity>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search materials..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Categories */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.name}
                                style={[
                                    styles.categoryCard,
                                    selectedCategory === category.name && { borderColor: category.color, borderWidth: 2 },
                                ]}
                                onPress={() => setSelectedCategory(category.name)}
                            >
                                <Text style={styles.categoryIcon}>{category.icon}</Text>
                                <Text style={styles.categoryName}>{category.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Products */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {selectedCategory === 'All' ? 'All Products' : selectedCategory}
                        </Text>
                        <Text style={styles.productCount}>
                            {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                        </Text>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FF6B00" />
                        </View>
                    ) : filteredProducts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No products available</Text>
                        </View>
                    ) : (
                        <View style={styles.productsGrid}>
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} onAddToCart={addItem} />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product, quantity: number, unit: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = () => {
        onAddToCart(product, quantity, product.unitType);
        setQuantity(1);
    };

    const getCategoryColor = (category: MaterialCategory): string => {
        const colors = {
            Cement: '#8B5CF6',
            Steel: '#3B82F6',
            Sand: '#F59E0B',
            Bricks: '#EF4444',
        };
        return colors[category];
    };

    return (
        <View style={styles.productCard}>
            <View style={[styles.productHeader, { backgroundColor: getCategoryColor(product.category) }]}>
                <View style={styles.productCategoryBadge}>
                    <Text style={styles.productCategoryText}>{product.category}</Text>
                </View>
                {product.bulkPrice && (
                    <View style={styles.bulkBadge}>
                        <Text style={styles.bulkBadgeText}>BULK</Text>
                    </View>
                )}
            </View>

            {/* Product Image */}
            {product.image && (
                <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                />
            )}

            <View style={styles.productBody}>
                <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                </Text>

                <View style={styles.priceContainer}>
                    <Ionicons name="pricetag" size={16} color="#FF6B00" style={{ marginRight: 6 }} />
                    <Text style={styles.productPrice}>{formatCurrency(product.pricePerUnit)}</Text>
                    <Text style={styles.productUnit}>per {product.unitType}</Text>
                </View>

                {product.bulkPrice && product.bulkThreshold && (
                    <View style={styles.bulkPriceContainer}>
                        <Ionicons name="cube-outline" size={14} color="#8B5CF6" style={{ marginRight: 4 }} />
                        <Text style={styles.bulkPriceLabel}>Bulk (≥{product.bulkThreshold}):</Text>
                        <Text style={styles.bulkPriceValue}>{formatCurrency(product.bulkPrice)}</Text>
                    </View>
                )}

                <View style={styles.stockContainer}>
                    <Ionicons
                        name={product.currentStock < 10 ? "alert-circle" : "checkmark-circle"}
                        size={16}
                        color={product.currentStock < 10 ? "#EF4444" : "#10B981"}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={styles.stockLabel}>In Stock:</Text>
                    <Text style={[styles.stockValue, product.currentStock < 10 && { color: '#EF4444' }]}>
                        {product.currentStock} {product.unitType}
                    </Text>
                </View>

                <View style={styles.quantityContainer}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                        <Text style={styles.quantityButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(Math.min(product.currentStock, quantity + 1))}
                    >
                        <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                    <Ionicons name="cart" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    bannerContainer: {
        flexGrow: 0,
    },
    banner: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 8,
        marginTop: -16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 4,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.9,
    },
    bannerPrice: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 4,
    },
    bannerBadge: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    bannerBadgeText: {
        color: '#FF6B00',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    stockCheckButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF6B00', // Matches restored theme
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    stockCheckIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    stockCheckText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        margin: 16,
        marginBottom: 8,
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    productCount: {
        fontSize: 14,
        color: '#666666',
    },
    categoriesScroll: {
        paddingLeft: 16,
    },
    categoryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        alignItems: 'center',
        minWidth: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    categoryIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    loadingContainer: {
        padding: 48,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666666',
    },
    productsGrid: {
        paddingHorizontal: 16,
    },
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    productHeader: {
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#F5F5F5',
    },
    productCategoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    productCategoryText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    bulkBadge: {
        backgroundColor: '#FFB800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    bulkBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    productBody: {
        padding: 16,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF6B00',
        marginRight: 6,
    },
    productUnit: {
        fontSize: 14,
        color: '#666666',
    },
    bulkPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#FFF7ED',
        borderRadius: 6,
    },
    bulkPriceLabel: {
        fontSize: 12,
        color: '#666666',
        marginRight: 6,
    },
    bulkPriceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F59E0B',
    },
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stockLabel: {
        fontSize: 13,
        color: '#666666',
        marginRight: 6,
    },
    stockValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10B981',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        gap: 16,
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityButtonText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    quantityText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        minWidth: 40,
        textAlign: 'center',
    },
    addToCartButton: {
        backgroundColor: '#FF6B00',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    addToCartText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
