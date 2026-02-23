import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Modal,
    ScrollView,
    Platform,
    LayoutAnimation,
    UIManager,
    Alert,
    Image,
} from 'react-native';
// Safe import for ImagePicker to prevent crash if native module is missing
let ImagePicker: any;
try {
    ImagePicker = require('expo-image-picker');
} catch (e) {
    console.warn('ImagePicker native module not found');
}

import { useProductStore } from '../../store/productStore';
import { subscribeToProducts, addProduct, updateProduct, updateStock, deleteProduct, uploadProductImage } from '../../services/productService';
import { Product, MaterialCategory } from '../../types';

// Moved UIManager check outside to be safe, but wrapped in try/catch if needed
try {
    if (Platform.OS === 'android') {
        if (typeof UIManager !== 'undefined' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }
} catch (e) { }

export default function AdminInventory() {
    const { products, setProducts, setLoading, isLoading } = useProductStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'All'>('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToProducts((fetchedProducts) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setProducts(fetchedProducts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCategoryChange = (category: MaterialCategory | 'All') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedCategory(category);
    };

    const handleDelete = (product: Product) => {
        if (Platform.OS === 'web') {
            if (confirm('Are you sure you want to delete this product?')) {
                deleteProduct(product.id);
            }
        } else {
            Alert.alert(
                'Delete Product',
                `Are you sure you want to delete ${product.name}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            deleteProduct(product.id);
                        }
                    }
                ]
            );
        }
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleStockAdjustment = async (product: Product, adjustment: number) => {
        const newStock = Math.max(0, product.currentStock + adjustment);
        try {
            await updateStock(product.id, newStock);
        } catch (error) {
            Alert.alert('Error', 'Failed to update stock');
        }
    };

    const categories: Array<MaterialCategory | 'All'> = ['All', 'Cement', 'Steel', 'Sand', 'Bricks'];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>THANGAM AGENCY</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>Manage Stock</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setEditingProduct(null);
                        setShowAddModal(true);
                    }}
                >
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={(text) => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setSearchQuery(text);
                    }}
                />
            </View>

            {/* Category Filter */}
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryChip,
                            selectedCategory === category && styles.categoryChipActive,
                        ]}
                        onPress={() => handleCategoryChange(category)}
                    >
                        <Text
                            style={[
                                styles.categoryChipText,
                                selectedCategory === category && styles.categoryChipTextActive,
                                { color: selectedCategory === category ? '#FFFFFF' : '#000000' }
                            ]}
                        >
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Product List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                </View>
            ) : filteredProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No products found</Text>
                    <Text style={styles.emptySubtext}>Add your first product to get started</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            onStockAdjust={handleStockAdjustment}
                            onEdit={() => {
                                setEditingProduct(item);
                                setShowAddModal(true);
                            }}
                            onDelete={() => handleDelete(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {/* Add/Edit Product Modal */}
            <AddProductModal
                visible={showAddModal}
                product={editingProduct}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                }}
            />
        </View>
    );
}

interface ProductCardProps {
    product: Product;
    onStockAdjust: (product: Product, adjustment: number) => void;
    onEdit: () => void;
    onDelete: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onStockAdjust, onEdit, onDelete }) => {
    const stockColor = product.currentStock < 10 ? '#EF4444' : '#10B981';

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>{product.name}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(product.category) }]}>
                        <Text style={styles.categoryBadgeText}>{product.category}</Text>
                    </View>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={onEdit} style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Price per {product.unitType}:</Text>
                    <Text style={styles.infoValue}>₹{product.pricePerUnit.toLocaleString()}</Text>
                </View>

                {product.bulkPrice && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Bulk Price (≥{product.bulkThreshold}):</Text>
                        <Text style={styles.infoValue}>₹{product.bulkPrice.toLocaleString()}</Text>
                    </View>
                )}

                <View style={[styles.infoRow, { marginTop: 12 }]}>
                    <Text style={styles.infoLabel}>Current Stock:</Text>
                    <Text style={[styles.stockValue, { color: stockColor }]}>
                        {product.currentStock} {product.unitType}
                    </Text>
                </View>
            </View>

            {/* Stock Adjustment */}
            <View style={styles.stockControls}>
                <TouchableOpacity
                    style={styles.stockButton}
                    onPress={() => onStockAdjust(product, -10)}
                >
                    <Text style={styles.stockButtonText}>-10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.stockButton}
                    onPress={() => onStockAdjust(product, -1)}
                >
                    <Text style={styles.stockButtonText}>-1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.stockButton, styles.stockButtonPrimary]}
                    onPress={() => onStockAdjust(product, 1)}
                >
                    <Text style={[styles.stockButtonText, styles.stockButtonTextPrimary]}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.stockButton, styles.stockButtonPrimary]}
                    onPress={() => onStockAdjust(product, 10)}
                >
                    <Text style={[styles.stockButtonText, styles.stockButtonTextPrimary]}>+10</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

interface AddProductModalProps {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ visible, product, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'Cement' as MaterialCategory,
        pricePerUnit: '',
        bulkPrice: '',
        bulkThreshold: '50',
        currentStock: '',
        unitType: 'bags',
    });
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const pickImage = async () => {
        if (!ImagePicker) {
            Alert.alert('Error', 'Image picker is not available on this device.');
            return;
        }
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library to upload a product image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        if (!ImagePicker) {
            Alert.alert('Error', 'Camera is not available on this device.');
            return;
        }
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your camera to take a product photo.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const showImageOptions = () => {
        if (Platform.OS === 'web') {
            pickImage();
            return;
        }
        Alert.alert(
            'Product Image',
            'Choose an option',
            [
                { text: 'Camera', onPress: takePhoto },
                { text: 'Photo Library', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                category: product.category,
                pricePerUnit: product.pricePerUnit.toString(),
                bulkPrice: product.bulkPrice?.toString() || '',
                bulkThreshold: product.bulkThreshold?.toString() || '50',
                currentStock: product.currentStock.toString(),
                unitType: product.unitType,
            });
            setImageUri(product.image || null);
        } else {
            setFormData({
                name: '',
                category: 'Cement',
                pricePerUnit: '',
                bulkPrice: '',
                bulkThreshold: '50',
                currentStock: '',
                unitType: 'bags',
            });
            setImageUri(null);
        }
    }, [product, visible]);

    const handleSave = async () => {
        if (!formData.name || !formData.pricePerUnit || !formData.currentStock) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            let imageUrl: string | undefined = product?.image;

            // Upload new image if one was selected (and it's a local URI, not existing URL)
            if (imageUri && imageUri !== product?.image) {
                setUploadingImage(true);
                const tempId = product?.id || `temp-${Date.now()}`;
                const { url, error: uploadError } = await uploadProductImage(imageUri, tempId);
                setUploadingImage(false);
                if (uploadError || !url) {
                    Alert.alert('Image Upload Failed', 'Product will be saved without the image.');
                } else {
                    imageUrl = url;
                }
            }

            const productData = {
                name: formData.name,
                category: formData.category,
                pricePerUnit: parseFloat(formData.pricePerUnit),
                basePrice: parseFloat(formData.pricePerUnit),
                bulkPrice: formData.bulkPrice ? parseFloat(formData.bulkPrice) : undefined,
                bulkThreshold: formData.bulkThreshold ? parseInt(formData.bulkThreshold) : undefined,
                currentStock: parseFloat(formData.currentStock),
                unitType: formData.unitType,
                image: imageUrl,
            };

            if (product) {
                await updateProduct(product.id, productData);
            } else {
                await addProduct(productData);
            }

            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to save product');
        } finally {
            setLoading(false);
            setUploadingImage(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{product ? 'Edit Product' : 'Add Product'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Image Picker */}
                        <Text style={styles.label}>Product Image</Text>
                        <TouchableOpacity style={styles.imagePickerButton} onPress={showImageOptions}>
                            {imageUri ? (
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.imagePreview}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Text style={styles.imagePlaceholderIcon}>📷</Text>
                                    <Text style={styles.imagePickerButtonText}>Tap to upload product image</Text>
                                    <Text style={styles.imagePlaceholderHint}>Camera or Photo Library</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        {imageUri && (
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setImageUri(null)}
                            >
                                <Text style={styles.removeImageButtonText}>✕ Remove Image</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.label}>Product Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="e.g., Ultratech Cement"
                        />

                        <Text style={styles.label}>Category *</Text>
                        <View style={styles.categoryGrid}>
                            {(['Cement', 'Steel', 'Sand', 'Bricks'] as MaterialCategory[]).map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.categoryOption,
                                        formData.category === cat && styles.categoryOptionActive,
                                    ]}
                                    onPress={() => setFormData({ ...formData, category: cat })}
                                >
                                    <Text
                                        style={[
                                            styles.categoryOptionText,
                                            formData.category === cat && styles.categoryOptionTextActive,
                                        ]}
                                    >
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Unit Type *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.unitType}
                            onChangeText={(text) => setFormData({ ...formData, unitType: text })}
                            placeholder="e.g., bags, tons, loads"
                        />

                        <Text style={styles.label}>Price per Unit *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.pricePerUnit}
                            onChangeText={(text) => setFormData({ ...formData, pricePerUnit: text })}
                            placeholder="0"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Bulk Price (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.bulkPrice}
                            onChangeText={(text) => setFormData({ ...formData, bulkPrice: text })}
                            placeholder="0"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Bulk Threshold</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.bulkThreshold}
                            onChangeText={(text) => setFormData({ ...formData, bulkThreshold: text })}
                            placeholder="50"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Current Stock *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.currentStock}
                            onChangeText={(text) => setFormData({ ...formData, currentStock: text })}
                            placeholder="0"
                            keyboardType="numeric"
                        />
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, (loading || uploadingImage) && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={loading || uploadingImage}
                        >
                            <Text style={styles.saveButtonText}>
                                {uploadingImage ? 'Uploading image...' : loading ? 'Saving...' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
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
    addButton: {
        backgroundColor: '#FF6B00',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    searchInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1A1A1A',
    },
    categoryContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    categoryChipActive: {
        backgroundColor: '#FF6B00',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '600',
    },
    categoryChipTextActive: {
        color: '#FFFFFF',
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
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666666',
    },
    listContent: {
        padding: 16,
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
    },
    cardTitleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    categoryBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FF6B00',
    },
    editButtonText: {
        color: '#FF6B00',
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardContent: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    stockValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    stockControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    stockButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        alignItems: 'center',
    },
    stockButtonPrimary: {
        backgroundColor: '#FF6B00',
        borderColor: '#FF6B00',
    },
    stockButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
    },
    stockButtonTextPrimary: {
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    modalClose: {
        fontSize: 24,
        color: '#666666',
    },
    modalBody: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1A1A1A',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        backgroundColor: '#F5F5F5',
    },
    categoryOptionActive: {
        backgroundColor: '#FF6B00',
        borderColor: '#FF6B00',
    },
    categoryOptionText: {
        fontSize: 14,
        color: '#666666',
        fontWeight: '500',
    },
    categoryOptionTextActive: {
        color: '#FFFFFF',
    },
    imagePickerButton: {
        borderWidth: 2,
        borderColor: '#FF6B00',
        borderStyle: 'dashed',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 8,
        minHeight: 160,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePickerButtonText: {
        fontSize: 15,
        color: '#FF6B00',
        fontWeight: '600',
        marginTop: 8,
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    imagePlaceholderIcon: {
        fontSize: 36,
        marginBottom: 8,
    },
    imagePlaceholderHint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
    },
    removeImageButton: {
        alignSelf: 'flex-end',
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginBottom: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 6,
    },
    removeImageButtonText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666666',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#FF6B00',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
