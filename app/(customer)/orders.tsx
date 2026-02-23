import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { subscribeToCustomerOrders, updateOrderStatus } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/materialMath';

export default function CustomerOrders() {
    const { user } = useAuthStore();
    const { orders, setOrders, setLoading, updateOrderStatus: updateOrderInStore, isLoading } = useOrderStore();
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const unsubscribe = subscribeToCustomerOrders(user.id, (fetchedOrders) => {
            setOrders(fetchedOrders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCancelOrder = (order: Order) => {
        Alert.alert(
            'Cancel Order',
            `Are you sure you want to cancel Order #${order.id.slice(-6).toUpperCase()}? This cannot be undone.`,
            [
                { text: 'Keep Order', style: 'cancel' },
                {
                    text: 'Cancel Order',
                    style: 'destructive',
                    onPress: async () => {
                        setCancellingId(order.id);
                        try {
                            const { error } = await updateOrderStatus(order.id, 'Cancelled');
                            if (error) {
                                Alert.alert('Error', 'Failed to cancel order. Please try again.');
                            } else {
                                updateOrderInStore(order.id, 'Cancelled');
                            }
                        } catch {
                            Alert.alert('Error', 'Something went wrong. Please try again.');
                        } finally {
                            setCancellingId(null);
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: OrderStatus): string => {
        const colors = {
            Pending: '#F59E0B',
            Approved: '#3B82F6',
            Loading: '#8B5CF6',
            OutForDelivery: '#06B6D4',
            Delivered: '#10B981',
            Cancelled: '#EF4444',
        };
        return colors[status] || '#666666';
    };

    const getStatusIcon = (status: OrderStatus): string => {
        const icons = {
            Pending: '⏳',
            Approved: '✓',
            Loading: '📦',
            OutForDelivery: '🚛',
            Delivered: '✅',
            Cancelled: '❌',
        };
        return icons[status] || '•';
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B00" />
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Orders</Text>
                <Text style={styles.orderCount}>
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </Text>
            </View>

            <ScrollView style={styles.ordersContainer} contentContainerStyle={styles.ordersContent}>
                {orders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                        onCancel={handleCancelOrder}
                        isCancelling={cancellingId === order.id}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

interface OrderCardProps {
    order: Order;
    getStatusColor: (status: OrderStatus) => string;
    getStatusIcon: (status: OrderStatus) => string;
    onCancel: (order: Order) => void;
    isCancelling: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, getStatusColor, getStatusIcon, onCancel, isCancelling }) => {
    const statusColor = getStatusColor(order.status);
    const statusIcon = getStatusIcon(order.status);

    return (
        <View style={styles.card}>
            <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                        <Text style={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusIcon}>{statusIcon}</Text>
                        <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.itemsContainer}>
                        <Text style={styles.itemsTitle}>Items:</Text>
                        {order.items.slice(0, 3).map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <Text style={styles.itemName}>• {item.productName}</Text>
                                <Text style={styles.itemQuantity}>
                                    {item.quantity} {item.unit}
                                </Text>
                            </View>
                        ))}
                        {order.items.length > 3 && (
                            <Text style={styles.moreItems}>+ {order.items.length - 3} more items</Text>
                        )}
                    </View>

                    {order.deliveryLocation && (
                        <View style={styles.locationContainer}>
                            <Text style={styles.locationLabel}>📍 Delivery Location:</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                                {order.deliveryLocation.address}
                            </Text>
                        </View>
                    )}

                    {order.driverName && order.status === 'OutForDelivery' && (
                        <View style={styles.driverContainer}>
                            <Text style={styles.driverLabel}>🚛 Driver:</Text>
                            <Text style={styles.driverName}>{order.driverName}</Text>
                        </View>
                    )}

                    <View style={styles.totalContainer}>
                        <View>
                            <Text style={styles.totalLabel}>Total Amount:</Text>
                            <Text style={styles.paymentLabel}>Payment: {order.paymentMethod || 'Cash on Delivery'}</Text>
                        </View>
                        <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
                    </View>
                </View>

                {order.status === 'OutForDelivery' && (
                    <View style={styles.trackingBanner}>
                        <Text style={styles.trackingText}>🚚 Your order is on the way!</Text>
                    </View>
                )}

                {order.status === 'Delivered' && order.deliveredAt && (
                    <View style={styles.deliveredBanner}>
                        <Text style={styles.deliveredText}>
                            ✅ Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN')}
                        </Text>
                    </View>
                )}

                {order.status === 'Pending' && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => onCancel(order)}
                        disabled={isCancelling}
                    >
                        {isCancelling ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.cancelButtonText}>✕  Cancel Order</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
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
    },
    header: {
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
    orderCount: {
        fontSize: 14,
        color: '#666666',
        marginTop: 4,
    },
    ordersContainer: {
        flex: 1,
    },
    ordersContent: {
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
    statusBar: {
        height: 4,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    orderId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    orderDate: {
        fontSize: 13,
        color: '#666666',
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    statusIcon: {
        fontSize: 14,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        gap: 16,
    },
    itemsContainer: {},
    itemsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 14,
        color: '#666666',
        flex: 1,
    },
    itemQuantity: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    moreItems: {
        fontSize: 13,
        color: '#666666',
        fontStyle: 'italic',
        marginTop: 4,
    },
    locationContainer: {},
    locationLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 13,
        color: '#666666',
        lineHeight: 18,
    },
    driverContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    driverLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    driverName: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '500',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    paymentLabel: {
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    trackingBanner: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#DBEAFE',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#06B6D4',
    },
    trackingText: {
        fontSize: 14,
        color: '#0369A1',
        fontWeight: '500',
    },
    deliveredBanner: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#ECFDF5',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    deliveredText: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
    },
    cancelButton: {
        marginTop: 12,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
