import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/(auth)/login');
        } else {
            console.log('User:', user);
            // DEBUG: specific check
            if (user.role !== 'admin') {
                alert(`Debug: You are logged in as ${user.role}. (Email: ${user.email})`);
            }
            if (user.role === 'admin') {
                alert(`Debug: Admin detected! Redirecting...`);
            }

            // Route based on user role
            switch (user.role) {
                case 'admin':
                    router.replace('/(admin)/inventory');
                    break;
                case 'driver':
                    router.replace('/(driver)/dashboard');
                    break;
                case 'customer':
                default:
                    router.replace('/(customer)/home');
                    break;
            }
        }
    }, [user, loading]);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#FF6B00', marginBottom: 16 }}>
                BuildMate
            </Text>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={{ color: '#666666', marginTop: 16 }}>Loading...</Text>
        </View>
    );
}
