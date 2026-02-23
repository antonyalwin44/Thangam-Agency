import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OrderConfirmation() {
    const router = useRouter();
    const { orderId, paymentMethod, total } = useLocalSearchParams<{
        orderId: string;
        paymentMethod: string;
        total: string;
    }>();

    const isCOD = paymentMethod === 'COD';

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Success Icon */}
            <View style={styles.iconCircle}>
                <Text style={styles.iconText}>✓</Text>
            </View>

            <Text style={styles.title}>Order Placed!</Text>
            <Text style={styles.subtitle}>
                Thank you for your order. We'll start processing it right away.
            </Text>

            {/* Order Details Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Order Summary</Text>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order ID</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                        #{orderId?.slice(0, 8).toUpperCase() ?? '—'}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Amount</Text>
                    <Text style={[styles.detailValue, { color: '#FF6B00' }]}>
                        ₹{parseFloat(total ?? '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment</Text>
                    <Text style={styles.detailValue}>
                        {isCOD ? 'Cash on Delivery' : paymentMethod}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Pending</Text>
                    </View>
                </View>
            </View>

            {/* COD Reminder */}
            {isCOD && (
                <View style={styles.codBanner}>
                    <Text style={styles.codBannerIcon}>💵</Text>
                    <Text style={styles.codBannerText}>
                        You will pay for your order in cash when it arrives at your delivery address.
                    </Text>
                </View>
            )}


            {/* Actions */}
            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace('/(customer)/orders')}
            >
                <Text style={styles.primaryButtonText}>View My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace('/(customer)/home')}
            >
                <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        flexGrow: 1,
    },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 20,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    iconText: {
        fontSize: 44,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666666',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        maxWidth: '55%',
        textAlign: 'right',
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        color: '#D97706',
        fontSize: 13,
        fontWeight: '600',
    },
    codBanner: {
        width: '100%',
        backgroundColor: '#FFF7ED',
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B00',
        borderRadius: 10,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    codBannerIcon: {
        fontSize: 22,
    },
    codBannerText: {
        flex: 1,
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#FF6B00',
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    secondaryButton: {
        width: '100%',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E5E5',
        backgroundColor: '#FFFFFF',
        marginBottom: 32,
    },
    secondaryButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '600',
    },
});
