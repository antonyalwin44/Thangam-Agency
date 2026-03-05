import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Alert, Platform, ActivityIndicator, Modal
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { updateUserProfile, signOut } from '../../services/authService';
import { useRouter } from 'expo-router';

export default function CustomerProfile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [logoutModal, setLogoutModal] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { setLoading(false); return; }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        if (!error && data) {
            setUser(data);
            setEditName(data.name || '');
            setEditAddress(data.address || '');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!editName.trim()) {
            showAlert('Error', 'Name cannot be empty.');
            return;
        }
        setSaving(true);
        const { error } = await updateUserProfile(user.id, {
            name: editName.trim(),
            address: editAddress.trim(),
        });
        setSaving(false);
        if (error) {
            showAlert('Error', 'Failed to update profile. Please try again.');
        } else {
            setUser({ ...user, name: editName.trim(), address: editAddress.trim() });
            setEditMode(false);
            showAlert('Success', 'Profile updated successfully!');
        }
    };

    const handleLogout = async () => {
        setLogoutModal(false);
        await signOut();
        router.replace('/(auth)/login');
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
        else Alert.alert(title, message);
    };

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.trim().split(' ').map(n => n[0]?.toUpperCase()).join('').slice(0, 2);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF6B00" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            {/* Avatar + Name Header */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
                </View>
                <Text style={styles.headerName}>{user?.name || 'Customer'}</Text>
                <Text style={styles.headerEmail}>{user?.email || ''}</Text>
                <View style={styles.badge}>
                    <Ionicons name="person" size={12} color="#FF6B00" />
                    <Text style={styles.badgeText}>Customer</Text>
                </View>
            </View>

            {/* Profile Info Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Profile Information</Text>
                    {!editMode && (
                        <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editBtn}>
                            <Ionicons name="pencil" size={16} color="#FF6B00" />
                            <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Name */}
                <View style={styles.fieldRow}>
                    <Ionicons name="person-outline" size={20} color="#999" style={styles.fieldIcon} />
                    <View style={styles.fieldContent}>
                        <Text style={styles.fieldLabel}>Full Name</Text>
                        {editMode ? (
                            <TextInput
                                style={styles.fieldInput}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Enter your name"
                                placeholderTextColor="#bbb"
                                autoCapitalize="words"
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{user?.name || '—'}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Email (read-only) */}
                <View style={styles.fieldRow}>
                    <Ionicons name="mail-outline" size={20} color="#999" style={styles.fieldIcon} />
                    <View style={styles.fieldContent}>
                        <Text style={styles.fieldLabel}>Email Address</Text>
                        <Text style={[styles.fieldValue, styles.readOnly]}>{user?.email || '—'}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Address */}
                <View style={styles.fieldRow}>
                    <Ionicons name="location-outline" size={20} color="#999" style={styles.fieldIcon} />
                    <View style={styles.fieldContent}>
                        <Text style={styles.fieldLabel}>Delivery Address</Text>
                        {editMode ? (
                            <TextInput
                                style={[styles.fieldInput, styles.multiline]}
                                value={editAddress}
                                onChangeText={setEditAddress}
                                placeholder="Enter your address"
                                placeholderTextColor="#bbb"
                                multiline
                                numberOfLines={3}
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{user?.address || '—'}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Joined Date */}
                <View style={styles.fieldRow}>
                    <Ionicons name="calendar-outline" size={20} color="#999" style={styles.fieldIcon} />
                    <View style={styles.fieldContent}>
                        <Text style={styles.fieldLabel}>Member Since</Text>
                        <Text style={styles.fieldValue}>
                            {user?.created_at
                                ? new Date(user.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })
                                : '—'}
                        </Text>
                    </View>
                </View>

                {/* Edit Actions */}
                {editMode && (
                    <View style={styles.editActions}>
                        <TouchableOpacity
                            style={styles.cancelEditBtn}
                            onPress={() => {
                                setEditMode(false);
                                setEditName(user?.name || '');
                                setEditAddress(user?.address || '');
                            }}
                            disabled={saving}
                        >
                            <Text style={styles.cancelEditText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#FFF" size="small" />
                                : <Text style={styles.saveBtnText}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => setLogoutModal(true)}
            >
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            {/* Logout Confirm Modal */}
            <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Ionicons name="log-out-outline" size={40} color="#FF3B30" style={{ alignSelf: 'center', marginBottom: 12 }} />
                        <Text style={styles.modalTitle}>Sign Out</Text>
                        <Text style={styles.modalSubtitle}>Are you sure you want to sign out?</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setLogoutModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalLogoutBtn} onPress={handleLogout}>
                                <Text style={styles.modalLogoutText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    scroll: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: {
        backgroundColor: '#FF6B00',
        paddingTop: 40,
        paddingBottom: 32,
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    headerEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        gap: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FF6B00',
        marginLeft: 4,
    },

    // Card
    card: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF4EE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    editBtnText: {
        color: '#FF6B00',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
    },
    fieldIcon: {
        marginTop: 2,
        marginRight: 12,
    },
    fieldContent: { flex: 1 },
    fieldLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    readOnly: { color: '#888' },
    fieldInput: {
        borderWidth: 1,
        borderColor: '#FF6B00',
        borderRadius: 10,
        padding: 10,
        fontSize: 15,
        color: '#1A1A1A',
        backgroundColor: '#FFF9F6',
    },
    multiline: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    editActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelEditBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        alignItems: 'center',
    },
    cancelEditText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    saveBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#FF6B00',
        alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginTop: 20,
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFECEC',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 4,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 360,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    modalLogoutBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#FF3B30',
        alignItems: 'center',
    },
    modalLogoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});
