import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { createOrder } from '../../services/orderService';
import { formatCurrency } from '../../utils/materialMath';
import { PaymentMethod } from '../../types';

type PaymentOption = {
    id: PaymentMethod;
    label: string;
    icon: string;
    description: string;
};

const PAYMENT_OPTIONS: PaymentOption[] = [
    { id: 'UPI', label: 'UPI', icon: '📲', description: 'Pay via UPI (Google Pay, PhonePe, etc.)' },
    { id: 'Card', label: 'Card', icon: '💳', description: 'Pay with Credit / Debit card' },
    { id: 'COD', label: 'Cash on Delivery', icon: '💵', description: 'Pay cash when your order arrives' },
];

export default function Checkout() {
    const router = useRouter();
    const { items, totalAmount, clearCart } = useCartStore();
    const { user } = useAuthStore();

    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState('');
    const [pincode, setPincode] = useState('');
    const [address, setAddress] = useState('');
    const [landmark, setLandmark] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
    const [cardNumber, setCardNumber] = useState('');
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(false);

    const isCOD = paymentMethod === 'COD';

    const handlePlaceOrder = async () => {
        if (!name.trim()) {
            Alert.alert('Missing Name', 'Please enter your name.');
            return;
        }
        if (!phone.trim() || phone.trim().length < 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
            return;
        }
        if (!pincode.trim() || pincode.trim().length !== 6) {
            Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode.');
            return;
        }
        if (!address.trim()) {
            Alert.alert('Missing Address', 'Please enter your delivery address.');
            return;
        }
        if (items.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty.');
            return;
        }

        setLoading(true);
        try {
            const orderItems = items.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                unit: item.unit,
                pricePerUnit: item.product.pricePerUnit,
                totalPrice: item.totalPrice,
            }));

            if (!user?.id) {
                Alert.alert('Sign In Required', 'Please sign in to place an order.');
                setLoading(false);
                return;
            }

            const { id: orderId, error } = await createOrder({
                customerId: user.id,
                customerName: name.trim(),
                customerPhone: phone.trim(),
                items: orderItems,
                totalAmount,
                status: 'Pending',
                deliveryLocation: {
                    latitude: 0,
                    longitude: 0,
                    address: `${address.trim()}, Pincode: ${pincode.trim()}`,
                    landmark: landmark.trim() || undefined,
                },
                paymentMethod,
                notes: isCOD ? 'Cash on Delivery' : undefined,
            });

            if (error) {
                const errorMessage = error.message || 'Could not place your order. Please try again.';
                Alert.alert('Order Failed', errorMessage);
                setLoading(false);
                return;
            }

            // Clear cart even if orderId is null (but error is null), as order might have been created
            clearCart();

            router.replace({
                pathname: '/(customer)/order-confirmation',
                params: {
                    orderId: orderId || 'SUCCESS',
                    paymentMethod,
                    total: totalAmount.toString(),
                },
            });
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <Text style={styles.pageTitle}>Checkout</Text>

                {/* ─── Customer Details ─── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 Customer Details</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                    <TextInput
                        style={[styles.input, { marginTop: 10 }]}
                        placeholder="Phone Number"
                        placeholderTextColor="#999"
                        value={phone}
                        onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />
                </View>

                {/* ─── Delivery Address ─── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Street address, building, area..."
                        placeholderTextColor="#999"
                        value={address}
                        onChangeText={setAddress}
                        multiline={true}
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                    <TextInput
                        style={[styles.input, { marginTop: 10 }]}
                        placeholder="Landmark (optional)"
                        placeholderTextColor="#999"
                        value={landmark}
                        onChangeText={setLandmark}
                    />
                    <TextInput
                        style={[styles.input, { marginTop: 10 }]}
                        placeholder="Pincode"
                        placeholderTextColor="#999"
                        value={pincode}
                        onChangeText={(t) => setPincode(t.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        maxLength={6}
                    />
                </View>

                {/* ─── Payment Method ─── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💳 Payment Method</Text>
                    <View style={styles.paymentOptions}>
                        {PAYMENT_OPTIONS.map(option => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.paymentOption,
                                    paymentMethod === option.id && styles.paymentOptionSelected,
                                ]}
                                onPress={() => setPaymentMethod(option.id)}
                            >
                                <View style={styles.paymentOptionLeft}>
                                    <View style={[
                                        styles.radioOuter,
                                        paymentMethod === option.id && styles.radioOuterSelected,
                                    ]}>
                                        {paymentMethod === option.id && <View style={styles.radioInner} />}
                                    </View>
                                    <View style={styles.paymentOptionTextBox}>
                                        <Text style={styles.paymentOptionIcon}>{option.icon}</Text>
                                        <Text style={[
                                            styles.paymentOptionLabel,
                                            paymentMethod === option.id && styles.paymentOptionLabelSelected,
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Conditional: COD message */}
                    {isCOD && (
                        <View style={styles.codBanner}>
                            <Text style={styles.codBannerIcon}>🏠</Text>
                            <Text style={styles.codBannerText}>
                                You will pay for your order in cash when it arrives at your delivery address.
                            </Text>
                        </View>
                    )}

                    {/* Conditional: UPI input */}
                    {paymentMethod === 'UPI' && (
                        <View style={styles.paymentInputBox}>
                            <Text style={styles.paymentInputLabel}>UPI ID</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. name@upi"
                                placeholderTextColor="#999"
                                value={upiId}
                                onChangeText={setUpiId}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <Text style={styles.paymentNote}>
                                ⚠️ UPI gateway integration is coming soon. Order will be placed and you can pay separately.
                            </Text>
                        </View>
                    )}

                    {/* Conditional: Card input */}
                    {paymentMethod === 'Card' && (
                        <View style={styles.paymentInputBox}>
                            <Text style={styles.paymentInputLabel}>Card Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1234 5678 9012 3456"
                                placeholderTextColor="#999"
                                value={cardNumber}
                                onChangeText={setCardNumber}
                                keyboardType="numeric"
                                maxLength={19}
                            />
                            <Text style={styles.paymentNote}>
                                ⚠️ Card gateway integration is coming soon. Order will be placed and you can pay separately.
                            </Text>
                        </View>
                    )}
                </View>

                {/* ─── Order Summary ─── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🧾 Order Summary</Text>
                    {items.map((item, index) => (
                        <View key={`${item.product.id}-${index}`} style={styles.orderItem}>
                            <View style={styles.orderItemLeft}>
                                <Text style={styles.orderItemName} numberOfLines={1}>{item.product.name}</Text>
                                <Text style={styles.orderItemUnit}>{item.quantity} {item.unit}</Text>
                            </View>
                            <Text style={styles.orderItemPrice}>{formatCurrency(item.totalPrice)}</Text>
                        </View>
                    ))}

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery</Text>
                        <Text style={[styles.summaryValue, { color: '#10B981' }]}>FREE</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
                    </View>
                </View>

                {/* ─── Place Order Button ─── */}
                <TouchableOpacity
                    style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.placeOrderButtonText}>
                            {isCOD ? '🛵 Place Order (COD)' : '🔒 Place Order'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    disabled={loading}
                >
                    <Text style={styles.backButtonText}>← Back to Cart</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 20,
        marginTop: 8,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 14,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#1A1A1A',
        backgroundColor: '#FAFAFA',
    },
    // ─── Payment ───────────────────────────────────────────
    paymentOptions: {
        gap: 10,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#E5E5E5',
        borderRadius: 10,
        padding: 14,
        backgroundColor: '#FAFAFA',
    },
    paymentOptionSelected: {
        borderColor: '#FF6B00',
        backgroundColor: '#FFF7ED',
        borderWidth: 2,
    },
    paymentOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CCCCCC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: '#FF6B00',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF6B00',
    },
    paymentOptionTextBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    paymentOptionIcon: {
        fontSize: 20,
    },
    paymentOptionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    paymentOptionLabelSelected: {
        color: '#FF6B00',
    },
    codBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF7ED',
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B00',
        borderRadius: 10,
        padding: 14,
        marginTop: 12,
        gap: 10,
    },
    codBannerIcon: {
        fontSize: 20,
    },
    codBannerText: {
        flex: 1,
        fontSize: 14,
        color: '#92400E',
        lineHeight: 21,
    },
    paymentInputBox: {
        marginTop: 14,
        gap: 8,
    },
    paymentInputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 2,
    },
    paymentNote: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        lineHeight: 18,
    },
    // ─── Order Summary ─────────────────────────────────────
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    orderItemLeft: {
        flex: 1,
        marginRight: 12,
    },
    orderItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    orderItemUnit: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    orderItemPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: '#E5E5E5',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    // ─── Buttons ───────────────────────────────────────────
    placeOrderButton: {
        backgroundColor: '#FF6B00',
        borderRadius: 12,
        paddingVertical: 17,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#FF6B00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    placeOrderButtonDisabled: {
        opacity: 0.6,
    },
    placeOrderButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    backButtonText: {
        color: '#666666',
        fontSize: 15,
        fontWeight: '500',
    },
});
