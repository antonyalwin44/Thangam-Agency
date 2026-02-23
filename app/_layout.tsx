import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { AuthProvider } from '../context/AuthContext';

// Ignore specific warnings
LogBox.ignoreLogs([
    'setLayoutAnimationEnabledExperimental', // Reanimated warning
    'shadow*" style props are deprecated', // React Native Web shadow deprecation
    'props.pointerEvents is deprecated', // React Native Web pointerEvents deprecation
    'ImagePicker.MediaTypeOptions', // expo-image-picker deprecation
]);

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="(customer)" />
                <Stack.Screen name="(driver)" />
            </Stack>
        </AuthProvider>
    );
}
