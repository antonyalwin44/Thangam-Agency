import { Stack } from 'expo-router';
import { LogoutButton } from '../../components/LogoutButton';

export default function DriverLayout() {
    return (
        <Stack screenOptions={{
            headerShown: true,
            headerRight: () => <LogoutButton />
        }}>
            <Stack.Screen
                name="dashboard"
                options={{ title: 'Driver Dashboard' }}
            />
        </Stack>
    );
}
