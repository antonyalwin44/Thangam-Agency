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
import { useOrderStore } from '../../store/orderStore';
import { subscribeToOrders, updateOrderStatus, assignDriver } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/materialMath';

const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Approved', 'Loading', 'OutForDelivery', 'Delivered'];

export default function AdminOrders() {
    const { orders, setOrders, setLoading, updateOrderStatus: updateOrderInStore, isLoading } = useOrderStore();
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('Pending');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToOrders((fetchedOrders) => {
            setOrders(fetchedOrders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getOrdersByStatus = (status: OrderStatus) => {
        return orders.filter((order) => order.status === status);
    };

    const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
        setUpdatingId(order.id);
        try {
            const { error } = await updateOrderStatus(order.id, newStatus);
            if (error) {
                Alert.alert('Error', 'Failed to update order status: ' + (error.message || JSON.stringify(error)));
            } else {
                // Optimistically update the store so the UI refreshes immediately
                updateOrderInStore(order.id, newStatus);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to update order status: ' + (error?.message || 'Unknown error'));
        } finally {
            setUpdatingId(null);
        }
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

    const getStatusCount = (status: OrderStatus) => {
        return getOrdersByStatus(status).length;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Order Management</Text>
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{orders.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                            {getStatusCount('Pending')}
                        </Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#06B6D4' }]}>
                            {getStatusCount('OutForDelivery')}
                        </Text>
                        <Text style={styles.statLabel}>In Transit</Text>
                    </View>
                </View>
            </View>

            {/* Status Tabs */}
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
                {ORDER_STATUSES.map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.tab,
                            selectedStatus === status && styles.tabActive,
                            { borderBottomColor: getStatusColor(status) },
                        ]}
                        onPress={() => setSelectedStatus(status)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                selectedStatus === status && styles.tabTextActive,
                            ]}
                        >
                            {status}
                        </Text>
                        <View
                            style={[
                                styles.tabBadge,
                                { backgroundColor: getStatusColor(status) },
                            ]}
                        >
                            <Text style={styles.tabBadgeText}>{getStatusCount(status)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Orders List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                </View>
            ) : (
                <ScrollView style={styles.ordersContainer}>
                    {getOrdersByStatus(selectedStatus).length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No {selectedStatus.toLowerCase()} orders</Text>
                        </View>
                    ) : (
                        getOrdersByStatus(selectedStatus).map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                isUpdating={updatingId === order.id}
                            />
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

interface OrderCardProps {
    order: Order;
    onStatusChange: (order: Order, newStatus: OrderStatus) => void;
    isUpdating: boolean;
}

const STATUS_FLOW: OrderStatus[] = ['Pending', 'Approved', 'Loading', 'OutForDelivery', 'Delivered'];

const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusChange, isUpdating }) => {
    // Use the actual order status (not the tab status) for correct next/prev calculation
    const getNextStatus = (): OrderStatus | null => {
        const currentIndex = STATUS_FLOW.indexOf(order.status);
        if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
            return STATUS_FLOW[currentIndex + 1];
        }
        return null;
    };

    const getPreviousStatus = (): OrderStatus | null => {
        const currentIndex = STATUS_FLOW.indexOf(order.status);
        if (currentIndex > 0) {
            return STATUS_FLOW[currentIndex - 1];
        }
        return null;
    };

    const nextStatus = getNextStatus();
    const previousStatus = getPreviousStatus();

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
                <View style={styles.orderAmountContainer}>
                    <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                    <Text style={styles.paymentMethodText}>{order.paymentMethod || 'Cash on Delivery'}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.customerInfo}>
                    <View style={styles.customerRow}>
                        <Text style={styles.customerLabel}>👤 Customer:</Text>
                        <Text style={styles.customerName}>{order.customerName || 'Customer'}</Text>
                    </View>
                    {order.customerPhone ? (
                        <View style={styles.customerRow}>
                            <Text style={styles.customerLabel}>📞 Phone:</Text>
                            <Text style={styles.customerPhone}>{order.customerPhone}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.itemsContainer}>
                    <Text style={styles.itemsTitle}>Items:</Text>
                    {order.items.slice(0, 2).map((item, index) => (
                        <Text key={index} style={styles.itemText}>
                            • {item.productName} - {item.quantity} {item.unit}
                        </Text>
                    ))}
                    {order.items.length > 2 && (
                        <Text style={styles.itemText}>+ {order.items.length - 2} more items</Text>
                    )}
                </View>

                {order.deliveryLocation && (
                    <View style={styles.locationContainer}>
                        <Text style={styles.locationLabel}>📋 Customer & Delivery Info:</Text>
                        <Text style={styles.locationText}>
                            {order.deliveryLocation.address}
                        </Text>
                    </View>
                )}

                {order.driverName && (
                    <View style={styles.driverInfo}>
                        <Text style={styles.driverLabel}>🚛 Driver:</Text>
                        <Text style={styles.driverName}>{order.driverName}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                {isUpdating ? (
                    <ActivityIndicator size="small" color="#FF6B00" style={{ flex: 1 }} />
                ) : (
                    <>
                        {previousStatus && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonSecondary]}
                                onPress={() => onStatusChange(order, previousStatus)}
                            >
                                <Text style={styles.actionButtonTextSecondary}>← {previousStatus}</Text>
                            </TouchableOpacity>
                        )}
                        {nextStatus && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonPrimary]}
                                onPress={() => onStatusChange(order, nextStatus)}
                            >
                                <Text style={styles.actionButtonText}>
                                    {nextStatus === 'Delivered' ? '✓ Mark Delivered' : `Move to ${nextStatus} →`}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {order.status === 'Pending' && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonDanger]}
                                onPress={() => onStatusChange(order, 'Cancelled')}
                            >
                                <Text style={styles.actionButtonTextDanger}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </>
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
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    statLabel: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
    },
    tabContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomWidth: 3,
    },
    tabText: {
        fontSize: 14,
        color: '#666666',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#1A1A1A',
        fontWeight: '600',
    },
    tabBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    tabBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ordersContainer: {
        flex: 1,
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        color: '#666666',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    orderDate: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
    },
    orderAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    orderAmountContainer: {
        alignItems: 'flex-end',
    },
    paymentMethodText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    cardBody: {
        marginBottom: 12,
    },
    customerInfo: {
        marginBottom: 12,
        gap: 4,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    customerLabel: {
        fontSize: 13,
        color: '#666666',
        fontWeight: '500',
    },
    customerName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    customerPhone: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    itemsContainer: {
        marginBottom: 12,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    itemText: {
        fontSize: 13,
        color: '#666666',
        marginBottom: 2,
    },
    locationContainer: {
        marginBottom: 12,
    },
    locationLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 13,
        color: '#666666',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    driverLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    driverName: {
        fontSize: 13,
        color: '#666666',
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonPrimary: {
        backgroundColor: '#FF6B00',
    },
    actionButtonSecondary: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    actionButtonDanger: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    actionButtonTextSecondary: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
    },
    actionButtonTextDanger: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
});
