import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LogoutButton } from '../../components/LogoutButton';

export default function CustomerLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: true,
            headerRight: () => <LogoutButton />,
            tabBarActiveTintColor: '#FF6B00',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
                borderTopWidth: 1,
                borderTopColor: '#F0F0F0',
                paddingTop: 4,
            },
            headerStyle: {
                backgroundColor: '#FF6B00',
            },
            headerTintColor: '#FFF',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
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
                    title: 'Stock',
                    tabBarLabel: 'Stock',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cube-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'My Profile',
                    tabBarLabel: 'Profile',
                    headerRight: () => null,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle-outline" size={size} color={color} />
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
