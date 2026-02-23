import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/materialMath';

export default function CustomerCart() {
    const router = useRouter();
    const { items, totalAmount, removeItem, updateQuantity, clearCart } = useCartStore();

    const handleCheckout = () => {
        if (items.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart before checking out');
            return;
        }
        router.push('/(customer)/checkout');
    };

    const handleClearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to remove all items from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCart },
            ]
        );
    };

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>Add some materials to get started</Text>
                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => router.push('/(customer)/home')}
                >
                    <Text style={styles.shopButtonText}>Start Shopping</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Shopping Cart</Text>
                    <Text style={styles.itemCount}>
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleClearCart}>
                    <Text style={styles.clearButton}>Clear All</Text>
                </TouchableOpacity>
            </View>

            {/* Cart Items */}
            <ScrollView style={styles.itemsContainer} contentContainerStyle={styles.itemsContent}>
                {items.map((item, index) => (
                    <CartItemCard
                        key={`${item.product.id}-${index}`}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                    />
                ))}
            </ScrollView>

            {/* Summary */}
            <View style={styles.summary}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery</Text>
                    <Text style={styles.summaryValue}>FREE</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                    <Text style={styles.summaryTotalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
                </View>

                <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                    <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

interface CartItemCardProps {
    item: any;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onUpdateQuantity, onRemove }) => {
    const { product, quantity, unit, totalPrice } = item;

    const handleQuantityChange = (delta: number) => {
        const newQuantity = Math.max(1, Math.min(product.currentStock, quantity + delta));
        onUpdateQuantity(product.id, newQuantity);
    };

    const getCategoryColor = (category: string): string => {
        const colors: Record<string, string> = {
            Cement: '#8B5CF6',
            Steel: '#3B82F6',
            Sand: '#F59E0B',
            Bricks: '#EF4444',
        };
        return colors[category] || '#666666';
    };

    return (
        <View style={styles.card}>
            <View style={[styles.cardColorBar, { backgroundColor: getCategoryColor(product.category) }]} />

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardTitle}>{product.name}</Text>
                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(product.category) }]}>
                            <Text style={styles.categoryBadgeText}>{product.category}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => onRemove(product.id)} style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Price per {unit}:</Text>
                        <Text style={styles.priceValue}>{formatCurrency(product.pricePerUnit)}</Text>
                    </View>

                    {product.bulkPrice && quantity >= (product.bulkThreshold || 50) && (
                        <View style={styles.bulkDiscountBanner}>
                            <Text style={styles.bulkDiscountText}>
                                🎉 Bulk discount applied! Saving {formatCurrency((product.pricePerUnit - product.bulkPrice) * quantity)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.quantityRow}>
                        <Text style={styles.quantityLabel}>Quantity:</Text>
                        <View style={styles.quantityControls}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1}
                            >
                                <Text style={[styles.quantityButtonText, quantity <= 1 && styles.quantityButtonDisabled]}>
                                    −
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.quantityValue}>
                                {quantity} {unit}
                            </Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => handleQuantityChange(1)}
                                disabled={quantity >= product.currentStock}
                            >
                                <Text
                                    style={[
                                        styles.quantityButtonText,
                                        quantity >= product.currentStock && styles.quantityButtonDisabled,
                                    ]}
                                >
                                    +
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Item Total:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 32,
    },
    shopButton: {
        backgroundColor: '#FF6B00',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 8,
    },
    shopButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    itemCount: {
        fontSize: 14,
        color: '#666666',
        marginTop: 4,
    },
    clearButton: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '600',
    },
    itemsContainer: {
        flex: 1,
    },
    itemsContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardColorBar: {
        height: 4,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 6,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    categoryBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: '#EF4444',
        fontSize: 18,
        fontWeight: '600',
    },
    cardBody: {
        gap: 12,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        color: '#666666',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    bulkDiscountBanner: {
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    bulkDiscountText: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '500',
    },
    quantityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quantityLabel: {
        fontSize: 14,
        color: '#666666',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    quantityButtonDisabled: {
        color: '#CCCCCC',
    },
    quantityValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        minWidth: 80,
        textAlign: 'center',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    summary: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#666666',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    summaryTotal: {
        paddingTop: 12,
        marginTop: 12,
        borderTopWidth: 2,
        borderTopColor: '#E5E5E5',
        marginBottom: 20,
    },
    summaryTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    checkoutButton: {
        backgroundColor: '#FF6B00',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
