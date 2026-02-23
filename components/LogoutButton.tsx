import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { signOut } from '../services/authService';

export const LogoutButton = () => {
    const router = useRouter();
    const { logout } = useAuthStore();

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to logout?');
            if (confirmed) {
                await signOut();
                logout();
                router.replace('/(auth)/login');
            }
        } else {
            Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: async () => {
                            await signOut();
                            logout();
                            router.replace('/(auth)/login');
                        },
                    },
                ]
            );
        }
    };

    return (
        <TouchableOpacity onPress={handleLogout} style={styles.button}>
            <Text style={styles.text}>Logout</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        marginRight: 16,
        padding: 8,
    },
    text: {
        color: '#FF6B00',
        fontWeight: '600',
        fontSize: 16,
    },
});
