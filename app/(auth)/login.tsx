import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { signIn, signUp, getUserData } from '../../services/authService';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            showAlert('Error', 'Please enter both email and password');
            return;
        }

        if (password.length < 6) {
            showAlert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        if (isSignUp) {
            // Sign Up Flow
            const { session, error } = await signUp(email, password);
            if (error) {
                setLoading(false);
                showAlert('Sign Up Error', error.message);
                return;
            }
            if (session) {
                showAlert('Success', 'Account created! Please sign in.');
                setIsSignUp(false); // Switch to sign in
                setLoading(false);
            } else {
                setLoading(false);
                showAlert('Check Email', 'Please check your email for a confirmation link.');
            }
        } else {
            // Sign In Flow
            const { session, error } = await signIn(email, password);
            if (error) {
                setLoading(false);
                // Customize error message for better UX
                if (error.message.includes('Invalid login credentials')) {
                    showAlert('Sign In Error', 'Invalid email or password.');
                } else {
                    showAlert('Sign In Error', error.message);
                }
                return;
            }

            if (session?.user) {
                // Fetch user data including role
                const userData = await getUserData(session.user.id, session.user.email);
                setLoading(false);

                if (userData) {
                    // DEBUG: Show role
                    if (userData.role === 'admin') {
                        alert('Debug: Role is ADMIN. Attempting redirect to /(admin)/dashboard');
                    } else {
                        alert(`Debug: Role is ${userData.role}. Redirecting to user home.`);
                    }

                    // Route based on user role
                    switch (userData.role) {
                        case 'admin':
                            router.replace('/(admin)/dashboard');
                            break;
                        case 'driver':
                            router.replace('/(driver)/dashboard');
                            break;
                        case 'customer':
                        default:
                            router.replace('/(customer)/home');
                            break;
                    }
                } else {
                    alert('Debug: User Profile NOT FOUND. Check Database RLS or Trigger.');
                    // Fallback if profile doesn't exist yet (should be created by trigger)
                    router.replace('/(customer)/home');
                }
            } else {
                setLoading(false);
            }
        }
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>THANGAM AGENCY</Text>
                <Text style={styles.subtitle}>Construction Materials</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        editable={!loading}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#999"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!loading}
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => setIsSignUp(!isSignUp)}
                        disabled={loading}
                    >
                        <Text style={styles.linkText}>
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF6B00',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        // width: 100,
        // height: 100,
        // Placeholder for logo size if needed
        height: 120, // Adjusted as per previous layout
        width: '100%',
    },
    form: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 24,
        color: '#1A1A1A',
        backgroundColor: '#F9FAFB',
    },
    button: {
        backgroundColor: '#FF6B00',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#FF6B00',
        fontSize: 14,
        fontWeight: '600',
    },
});
