import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LogoutButton } from '../../components/LogoutButton';

export default function CustomerLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: true,
            headerRight: () => <LogoutButton />
        }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'Cart',
                    tabBarLabel: 'Cart',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cart" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'My Orders',
                    tabBarLabel: 'Orders',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="stock"
                options={{
                    title: 'Stock Availability',
                    tabBarLabel: 'Stock',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cube-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="checkout"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="order-confirmation"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
