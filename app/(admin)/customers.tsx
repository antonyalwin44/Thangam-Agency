import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

interface CustomerRecord {
    id: string;
    name: string | null;
    email: string;
    address: string | null;
    created_at: string;
    orderCount: number;
    totalSpent: number;
    lastOrderAt: string | null;
}

const STATUS_COLORS = {
    active: '#10B981',
    new: '#3B82F6',
    inactive: '#94A3B8',
};

export default function AdminCustomers() {
    const [customers, setCustomers] = useState<CustomerRecord[]>([]);
    const [filtered, setFiltered] = useState<CustomerRecord[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selected, setSelected] = useState<CustomerRecord | null>(null);

    const fetchCustomers = useCallback(async () => {
        // Fetch all users with role = customer
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, address, created_at')
            .eq('role', 'customer')
            .order('created_at', { ascending: false });

        if (error || !users) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        // Fetch orders to compute per-customer stats
        const { data: orders } = await supabase
            .from('orders')
            .select('customer_id, total_amount, created_at, status');

        const orderMap: Record<string, { count: number; total: number; lastAt: string | null }> = {};
        (orders || []).forEach((o: any) => {
            const cid = o.customer_id;
            if (!orderMap[cid]) orderMap[cid] = { count: 0, total: 0, lastAt: null };
            orderMap[cid].count += 1;
            if (o.status === 'Delivered') orderMap[cid].total += Number(o.total_amount) || 0;
            if (!orderMap[cid].lastAt || o.created_at > orderMap[cid].lastAt!) {
                orderMap[cid].lastAt = o.created_at;
            }
        });

        const result: CustomerRecord[] = users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            address: u.address,
            created_at: u.created_at,
            orderCount: orderMap[u.id]?.count || 0,
            totalSpent: orderMap[u.id]?.total || 0,
            lastOrderAt: orderMap[u.id]?.lastAt || null,
        }));

        setCustomers(result);
        setFiltered(result);
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => { fetchCustomers(); }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            customers.filter(c =>
                (c.name || '').toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q)
            )
        );
    }, [search, customers]);

    const onRefresh = () => { setRefreshing(true); fetchCustomers(); };

    const getStatus = (c: CustomerRecord) => {
        if (c.orderCount === 0) return 'new';
        const lastOrder = c.lastOrderAt ? new Date(c.lastOrderAt) : null;
        if (!lastOrder) return 'new';
        const daysSince = (Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30 ? 'active' : 'inactive';
    };

    const getStatusLabel = (status: string) => {
        if (status === 'new') return 'New';
        if (status === 'active') return 'Active';
        return 'Inactive';
    };

    const getInitials = (name: string | null, email: string) => {
        if (name?.trim()) return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return email[0].toUpperCase();
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const formatCurrency = (n: number) =>
        `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    const activeCount = customers.filter(c => getStatus(c) === 'active').length;
    const newCount = customers.filter(c => getStatus(c) === 'new').length;

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={styles.loadingText}>Loading customers…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Summary Strip */}
            <View style={styles.summaryStrip}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{customers.length}</Text>
                    <Text style={styles.summaryLabel}>Total</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>{activeCount}</Text>
                    <Text style={styles.summaryLabel}>Active</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>{newCount}</Text>
                    <Text style={styles.summaryLabel}>New</Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color="#94A3B8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or email…"
                    placeholderTextColor="#94A3B8"
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B00']} />}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyText}>No customers found</Text>
                    </View>
                }
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                renderItem={({ item }) => {
                    const status = getStatus(item);
                    const initials = getInitials(item.name, item.email);
                    return (
                        <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.75}>
                            {/* Avatar */}
                            <View style={[styles.avatar, { backgroundColor: status === 'active' ? '#FFF4EE' : status === 'new' ? '#EFF6FF' : '#F1F5F9' }]}>
                                <Text style={[styles.avatarText, { color: status === 'active' ? '#FF6B00' : status === 'new' ? '#3B82F6' : '#64748B' }]}>
                                    {initials}
                                </Text>
                            </View>

                            {/* Info */}
                            <View style={styles.cardInfo}>
                                <View style={styles.cardTopRow}>
                                    <Text style={styles.customerName} numberOfLines={1}>
                                        {item.name || 'No Name'}
                                    </Text>
                                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] + '22' }]}>
                                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }]} />
                                        <Text style={[styles.statusText, { color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }]}>
                                            {getStatusLabel(status)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.customerEmail} numberOfLines={1}>{item.email}</Text>
                                <View style={styles.cardStats}>
                                    <Text style={styles.statChip}>🛍 {item.orderCount} orders</Text>
                                    <Text style={styles.statChip}>📅 Joined {formatDate(item.created_at)}</Text>
                                </View>
                            </View>

                            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ alignSelf: 'center' }} />
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Customer Detail Modal */}
            <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <TouchableOpacity style={styles.modalClose} onPress={() => setSelected(null)}>
                            <Ionicons name="close" size={22} color="#64748B" />
                        </TouchableOpacity>

                        {selected && (() => {
                            const status = getStatus(selected);
                            const initials = getInitials(selected.name, selected.email);
                            return (
                                <>
                                    {/* Modal Avatar */}
                                    <View style={[styles.modalAvatar, { backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] + '22' }]}>
                                        <Text style={[styles.modalAvatarText, { color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }]}>{initials}</Text>
                                    </View>
                                    <Text style={styles.modalName}>{selected.name || 'No Name'}</Text>
                                    <Text style={styles.modalEmail}>{selected.email}</Text>
                                    <View style={[styles.statusBadge, { alignSelf: 'center', marginBottom: 20, backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] + '22' }]}>
                                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }]} />
                                        <Text style={[styles.statusText, { color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }]}>{getStatusLabel(status)}</Text>
                                    </View>

                                    {/* Detail Rows */}
                                    <View style={styles.detailGrid}>
                                        <View style={styles.detailBox}>
                                            <Text style={styles.detailBoxValue}>{selected.orderCount}</Text>
                                            <Text style={styles.detailBoxLabel}>Total Orders</Text>
                                        </View>
                                        <View style={styles.detailBox}>
                                            <Text style={styles.detailBoxValue}>{formatCurrency(selected.totalSpent)}</Text>
                                            <Text style={styles.detailBoxLabel}>Amount Spent</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                                        <Text style={styles.detailLabel}>Joined</Text>
                                        <Text style={styles.detailValue}>{formatDate(selected.created_at)}</Text>
                                    </View>
                                    {selected.lastOrderAt && (
                                        <View style={styles.detailRow}>
                                            <Ionicons name="time-outline" size={16} color="#94A3B8" />
                                            <Text style={styles.detailLabel}>Last Order</Text>
                                            <Text style={styles.detailValue}>{formatDate(selected.lastOrderAt)}</Text>
                                        </View>
                                    )}
                                    {selected.address && (
                                        <View style={styles.detailRow}>
                                            <Ionicons name="location-outline" size={16} color="#94A3B8" />
                                            <Text style={styles.detailLabel}>Address</Text>
                                            <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{selected.address}</Text>
                                        </View>
                                    )}
                                </>
                            );
                        })()}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#64748B', fontSize: 14 },

    summaryStrip: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 14,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
    summaryLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
    summaryDivider: { width: 1, backgroundColor: '#E2E8F0' },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 12,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#1E293B' },

    card: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        gap: 12,
        alignItems: 'flex-start',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: 'bold' },
    cardInfo: { flex: 1 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    customerName: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1 },
    customerEmail: { fontSize: 13, color: '#64748B', marginBottom: 6 },
    cardStats: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    statChip: { fontSize: 12, color: '#475569' },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        gap: 4,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '600' },

    emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: 15, color: '#94A3B8' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 36,
    },
    modalClose: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
    modalAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 12,
    },
    modalAvatarText: { fontSize: 26, fontWeight: 'bold' },
    modalName: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
    modalEmail: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 10 },

    detailGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    detailBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    detailBoxValue: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    detailBoxLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },

    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 8,
    },
    detailLabel: { fontSize: 14, color: '#64748B', flex: 1 },
    detailValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
});
