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
import { subscribeToOrders, updateOrderStatus } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/materialMath';

export default function DriverDashboard() {
    const { user } = useAuthStore();
    const { orders, setOrders, setLoading, isLoading } = useOrderStore();
    const [selectedTab, setSelectedTab] = useState<'assigned' | 'completed'>('assigned');

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const unsubscribe = subscribeToOrders((fetchedOrders) => {
            // Show all Loading, OutForDelivery, and Delivered orders for the driver
            const driverOrders = fetchedOrders.filter(
                (order) =>
                    order.status === 'Loading' ||
                    order.status === 'OutForDelivery' ||
                    order.status === 'Delivered'
            );
            setOrders(driverOrders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const assignedOrders = orders.filter(
        (order) => order.status === 'Loading' || order.status === 'OutForDelivery'
    );

    const completedOrders = orders.filter((order) => order.status === 'Delivered');

    const handleStartDelivery = async (order: Order) => {
        Alert.alert(
            'Start Delivery',
            `Start delivering order #${order.id.slice(-6).toUpperCase()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start',
                    onPress: async () => {
                        try {
                            await updateOrderStatus(order.id, 'OutForDelivery');
                            Alert.alert('Success', 'Delivery started! GPS tracking is now active.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to start delivery');
                        }
                    },
                },
            ]
        );
    };

    const handleCompleteDelivery = async (order: Order) => {
        Alert.alert(
            'Complete Delivery',
            'Mark this order as delivered?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete',
                    onPress: async () => {
                        try {
                            await updateOrderStatus(order.id, 'Delivered');
                            Alert.alert('Success', 'Order marked as delivered!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to complete delivery');
                        }
                    },
                },
            ]
        );
    };

    const displayOrders = selectedTab === 'assigned' ? assignedOrders : completedOrders;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Driver Dashboard</Text>
                    <Text style={styles.subtitle}>Welcome, {user?.name || 'Driver'}</Text>
                </View>
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{assignedOrders.length}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{completedOrders.length}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'assigned' && styles.tabActive]}
                    onPress={() => setSelectedTab('assigned')}
                >
                    <Text style={[styles.tabText, selectedTab === 'assigned' && styles.tabTextActive]}>
                        Assigned ({assignedOrders.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
                    onPress={() => setSelectedTab('completed')}
                >
                    <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
                        Completed ({completedOrders.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Orders List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                </View>
            ) : displayOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>
                        {selectedTab === 'assigned' ? '📦' : '✅'}
                    </Text>
                    <Text style={styles.emptyTitle}>
                        {selectedTab === 'assigned' ? 'No active deliveries' : 'No completed deliveries'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {selectedTab === 'assigned'
                            ? 'New orders will appear here'
                            : 'Your delivery history will appear here'}
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.ordersContainer} contentContainerStyle={styles.ordersContent}>
                    {displayOrders.map((order) => (
                        <DriverOrderCard
                            key={order.id}
                            order={order}
                            onStartDelivery={handleStartDelivery}
                            onCompleteDelivery={handleCompleteDelivery}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

interface DriverOrderCardProps {
    order: Order;
    onStartDelivery: (order: Order) => void;
    onCompleteDelivery: (order: Order) => void;
}

const DriverOrderCard: React.FC<DriverOrderCardProps> = ({
    order,
    onStartDelivery,
    onCompleteDelivery,
}) => {
    const getStatusColor = (status: OrderStatus): string => {
        const colors = {
            Loading: '#8B5CF6',
            OutForDelivery: '#06B6D4',
            Delivered: '#10B981',
        };
        return colors[status as keyof typeof colors] || '#666666';
    };

    const isLoading = order.status === 'Loading';
    const isInTransit = order.status === 'OutForDelivery';
    const isDelivered = order.status === 'Delivered';

    return (
        <View style={styles.card}>
            <View style={[styles.statusBar, { backgroundColor: getStatusColor(order.status) }]} />

            <View style={styles.cardContent}>
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
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                        <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.customerInfo}>
                        <Text style={styles.infoLabel}>👤 Customer:</Text>
                        <Text style={styles.infoValue}>{order.customerName || 'N/A'}</Text>
                        <Text style={styles.customerPhone}>{order.customerPhone}</Text>
                    </View>

                    <View style={styles.locationInfo}>
                        <Text style={styles.infoLabel}>📍 Delivery Location:</Text>
                        <Text style={styles.locationText} numberOfLines={3}>
                            {order.deliveryLocation?.address || 'No address provided'}
                        </Text>
                    </View>

                    <View style={styles.itemsInfo}>
                        <Text style={styles.infoLabel}>📦 Items ({order.items.length}):</Text>
                        {order.items.slice(0, 2).map((item, index) => (
                            <Text key={index} style={styles.itemText}>
                                • {item.productName} - {item.quantity} {item.unit}
                            </Text>
                        ))}
                        {order.items.length > 2 && (
                            <Text style={styles.itemText}>+ {order.items.length - 2} more</Text>
                        )}
                    </View>

                    <View style={styles.amountInfo}>
                        <Text style={styles.amountLabel}>Total Amount:</Text>
                        <Text style={styles.amountValue}>{formatCurrency(order.totalAmount)}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    {isLoading && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => onStartDelivery(order)}
                        >
                            <Text style={styles.primaryButtonText}>🚛 Start Delivery</Text>
                        </TouchableOpacity>
                    )}

                    {isInTransit && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => onCompleteDelivery(order)}
                        >
                            <Text style={styles.primaryButtonText}>✓ Mark Delivered</Text>
                        </TouchableOpacity>
                    )}

                    {isDelivered && (
                        <View style={styles.deliveredBanner}>
                            <Text style={styles.deliveredText}>
                                ✅ Delivered{order.deliveredAt ? ` on ${new Date(order.deliveredAt).toLocaleDateString('en-IN')}` : ''}
                            </Text>
                        </View>
                    )}
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
    subtitle: {
        fontSize: 14,
        color: '#666666',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    statLabel: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#FF6B00',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#666666',
    },
    tabTextActive: {
        color: '#FF6B00',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        gap: 16,
    },
    customerInfo: {
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
    },
    locationInfo: {
        backgroundColor: '#FFF7ED',
        padding: 12,
        borderRadius: 8,
    },
    itemsInfo: {
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
    },
    amountInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 6,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    customerPhone: {
        fontSize: 13,
        color: '#666666',
        marginTop: 2,
    },
    locationText: {
        fontSize: 13,
        color: '#666666',
        lineHeight: 18,
    },
    itemText: {
        fontSize: 13,
        color: '#666666',
        marginBottom: 2,
    },
    amountLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    amountValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#FF6B00',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    secondaryButtonText: {
        color: '#1A1A1A',
        fontSize: 15,
        fontWeight: '600',
    },
    deliveredBanner: {
        flex: 1,
        padding: 12,
        backgroundColor: '#ECFDF5',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    deliveredText: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '500',
        textAlign: 'center',
    },
});
