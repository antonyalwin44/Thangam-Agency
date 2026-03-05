import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LogoutButton } from '../../components/LogoutButton';

export default function AdminLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: true,
            headerRight: () => <LogoutButton />,
            tabBarActiveTintColor: '#FF6B00',
            tabBarInactiveTintColor: '#94A3B8',
            tabBarStyle: {
                borderTopWidth: 1,
                borderTopColor: '#E2E8F0',
                paddingTop: 4,
            },
            headerStyle: { backgroundColor: '#1E293B' },
            headerTintColor: '#FFF',
            headerTitleStyle: { fontWeight: 'bold' },
        }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="stats-chart" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    tabBarLabel: 'Orders',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="customers"
                options={{
                    title: 'Customers',
                    tabBarLabel: 'Customers',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="inventory"
                options={{
                    title: 'Inventory',
                    tabBarLabel: 'Inventory',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cube" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
