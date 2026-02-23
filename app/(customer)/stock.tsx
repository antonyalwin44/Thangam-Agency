import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useProductStore } from '../../store/productStore';
import { subscribeToProducts } from '../../services/productService';
import { Product } from '../../types';

export default function CustomerStockView() {
    const router = useRouter();
    const { products, setProducts, setLoading, isLoading } = useProductStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToProducts((fetchedProducts) => {
            setProducts(fetchedProducts);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStockColor = (stock: number) => {
        if (stock === 0) return '#EF4444'; // Red
        if (stock < 10) return '#F59E0B'; // Orange
        return '#10B981'; // Green
    };

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.row}>
            <View style={styles.cellName}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
            </View>
            <View style={styles.cellStock}>
                <View style={[styles.stockBadge, { backgroundColor: getStockColor(item.currentStock) }]}>
                    <Text style={styles.stockText}>
                        {item.currentStock} {item.unitType}
                    </Text>
                </View>
                {item.currentStock === 0 && <Text style={styles.outOfStockText}>Out of Stock</Text>}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Current Stock Availability</Text>
            </View>

            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search product..."
                    placeholderTextColor="#999999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                </View>
            ) : (
                <View style={styles.listContainer}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.headerTextName}>Product</Text>
                        <Text style={styles.headerTextStock}>Availability</Text>
                    </View>
                    <FlatList
                        data={filteredProducts}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No products found</Text>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        marginRight: 16,
        padding: 8,
    },
    backButtonText: {
        fontSize: 24,
        color: '#1A1A1A',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTextName: {
        flex: 2,
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
    },
    headerTextStock: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
        textAlign: 'right',
    },
    listContent: {
        paddingBottom: 24,
    },
    row: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
    },
    cellName: {
        flex: 2,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 12,
        color: '#666666',
        backgroundColor: '#F3F4F6',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    cellStock: {
        flex: 1,
        alignItems: 'flex-end',
    },
    stockBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stockText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    outOfStockText: {
        fontSize: 10,
        color: '#EF4444',
        marginTop: 4,
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
});
