import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useProductStore } from '../../store/productStore';
import { subscribeToProducts } from '../../services/productService';
import { subscribeToOrders } from '../../services/orderService';
import { formatCurrency } from '../../utils/materialMath';
import { Order } from '../../types';

export default function AdminDashboard() {
    const router = useRouter();
    const { products, setProducts, setLoading } = useProductStore();
    const [orders, setOrders] = useState<Order[]>([]);

    // Subscribe to products in real-time
    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToProducts((fetchedProducts) => {
            setProducts(fetchedProducts);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Subscribe to orders in real-time
    useEffect(() => {
        const unsubscribe = subscribeToOrders((fetchedOrders) => {
            setOrders(fetchedOrders);
        });
        return () => unsubscribe();
    }, []);

    // ─── Computed Stats (live) ─────────────────────────────────────

    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.currentStock < 10).length;

    // Today's Revenue: Delivered orders created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayDelivered = orders.filter(
        o => o.status === 'Delivered' && new Date(o.createdAt) >= todayStart
    );
    const todaysRevenue = todayDelivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Pending Orders: Pending or Approved
    const pendingCount = orders.filter(
        o => o.status === 'Pending' || o.status === 'Approved'
    ).length;
    const needAttentionCount = orders.filter(o => o.status === 'Pending').length;

    // All-time Revenue: all Delivered orders
    const allDelivered = orders.filter(o => o.status === 'Delivered');
    const allTimeRevenue = allDelivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Welcome back, Admin</Text>
                <Text style={styles.dateText}>{new Date().toDateString()}</Text>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
                {/* Today's Revenue */}
                <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
                    <Text style={styles.statLabel}>Today's Revenue</Text>
                    <Text style={styles.statValue}>{formatCurrency(todaysRevenue)}</Text>
                    <Text style={styles.statSubtext}>
                        {todayDelivered.length} order{todayDelivered.length !== 1 ? 's' : ''} delivered today
                    </Text>
                </View>

                {/* Pending Orders */}
                <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.statLabel}>Pending Orders</Text>
                    <Text style={styles.statValue}>{pendingCount}</Text>
                    <Text style={styles.statSubtext}>
                        {needAttentionCount > 0
                            ? `${needAttentionCount} require attention`
                            : 'All orders up to date'}
                    </Text>
                </View>

                {/* Low Stock */}
                <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.statLabel}>Low Stock Alert</Text>
                    <Text style={styles.statValue}>{lowStockItems}</Text>
                    <Text style={styles.statSubtext}>Items below threshold</Text>
                </View>

                {/* Total Inventory */}
                <View style={[styles.statCard, { backgroundColor: '#6366F1' }]}>
                    <Text style={styles.statLabel}>Total Inventory</Text>
                    <Text style={styles.statValue}>{totalProducts}</Text>
                    <Text style={styles.statSubtext}>Active products</Text>
                </View>
            </View>

            {/* All-Time Revenue Banner */}
            <View style={styles.revenueBanner}>
                <Text style={styles.revenueBannerLabel}>💰 Total Revenue (All Time)</Text>
                <Text style={styles.revenueBannerValue}>{formatCurrency(allTimeRevenue)}</Text>
                <Text style={styles.revenueBannerSub}>
                    From {allDelivered.length} delivered order{allDelivered.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/(admin)/inventory')}
                >
                    <Text style={styles.actionIcon}>📦</Text>
                    <Text style={styles.actionText}>Manage Inventory</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/(admin)/orders')}
                >
                    <Text style={styles.actionIcon}>📄</Text>
                    <Text style={styles.actionText}>View Orders</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/(driver)/dashboard')}
                >
                    <Text style={styles.actionIcon}>🚚</Text>
                    <Text style={styles.actionText}>Driver Map</Text>
                </TouchableOpacity>
            </View>

            {/* Low Stock Items List */}
            {lowStockItems > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>⚠️ Low Stock Attention</Text>
                    {products.filter(p => p.currentStock < 10).slice(0, 3).map(product => (
                        <View key={product.id} style={styles.alertItem}>
                            <Text style={styles.alertText}>{product.name}</Text>
                            <Text style={styles.alertValue}>{product.currentStock} {product.unitType} left</Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        padding: 16,
    },
    header: {
        marginBottom: 24,
        marginTop: 8,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    dateText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statSubtext: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
    },
    revenueBanner: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    revenueBannerLabel: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    revenueBannerValue: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    revenueBannerSub: {
        color: '#64748B',
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    alertItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    alertText: {
        color: '#334155',
        fontSize: 14,
    },
    alertValue: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 14,
    },
});
