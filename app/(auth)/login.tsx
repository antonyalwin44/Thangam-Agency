import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, Image, Platform, ActivityIndicator, Modal, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signIn, signUp, getUserData, resetPassword } from '../../services/authService';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password modal state
    const [forgotVisible, setForgotVisible] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            showAlert('Error', 'Please enter both email and password');
            return;
        }

        if (isSignUp && !name.trim()) {
            showAlert('Error', 'Please enter your full name');
            return;
        }

        if (password.length < 6) {
            showAlert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        if (isSignUp) {
            // Sign Up Flow
            const { session, error } = await signUp(email, password, name.trim());
            if (error) {
                setLoading(false);
                showAlert('Sign Up Error', error.message);
                return;
            }
            if (session) {
                showAlert('Success', 'Account created! Please sign in.');
                setIsSignUp(false);
                setName('');
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
                if (error.message.includes('Invalid login credentials')) {
                    showAlert('Sign In Error', 'Invalid email or password.');
                } else {
                    showAlert('Sign In Error', error.message);
                }
                return;
            }

            if (session?.user) {
                const userData = await getUserData(session.user.id, session.user.email);
                setLoading(false);

                if (userData) {
                    if (userData.role === 'admin') {
                        alert('Debug: Role is ADMIN. Attempting redirect to /(admin)/dashboard');
                    } else {
                        alert(`Debug: Role is ${userData.role}. Redirecting to user home.`);
                    }

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
                    router.replace('/(customer)/home');
                }
            } else {
                setLoading(false);
            }
        }
    };

    const handleForgotPassword = async () => {
        if (!resetEmail.trim()) {
            showAlert('Error', 'Please enter your email address.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(resetEmail.trim())) {
            showAlert('Error', 'Please enter a valid email address.');
            return;
        }

        setResetLoading(true);
        const { error } = await resetPassword(resetEmail.trim());
        setResetLoading(false);

        if (error) {
            showAlert('Error', error.message || 'Failed to send reset email. Please try again.');
        } else {
            setResetSent(true);
        }
    };

    const closeForgotModal = () => {
        setForgotVisible(false);
        setResetEmail('');
        setResetSent(false);
        setResetLoading(false);
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
                    {/* Name field — only shown in Sign Up mode */}
                    {isSignUp && (
                        <>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor="#999"
                                autoCapitalize="words"
                                value={name}
                                onChangeText={setName}
                                editable={!loading}
                            />
                        </>
                    )}

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
                    <View style={styles.passwordWrapper}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter your password"
                            placeholderTextColor="#999"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={22}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Forgot Password link — only shown on Sign In mode */}
                    {!isSignUp && (
                        <TouchableOpacity
                            style={styles.forgotButton}
                            onPress={() => setForgotVisible(true)}
                            disabled={loading}
                        >
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    )}

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

            {/* ── Forgot Password Modal ── */}
            <Modal
                visible={forgotVisible}
                transparent
                animationType="fade"
                onRequestClose={closeForgotModal}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={styles.modalCard}>
                            {!resetSent ? (
                                <>
                                    <Text style={styles.modalTitle}>Reset Password</Text>
                                    <Text style={styles.modalSubtitle}>
                                        Enter your registered email address. We'll send you a link to reset your password.
                                    </Text>

                                    <Text style={styles.label}>Email Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#999"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={resetEmail}
                                        onChangeText={setResetEmail}
                                        editable={!resetLoading}
                                    />

                                    <TouchableOpacity
                                        style={[styles.button, resetLoading && styles.buttonDisabled]}
                                        onPress={handleForgotPassword}
                                        disabled={resetLoading}
                                    >
                                        {resetLoading ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.buttonText}>Send Reset Link</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={closeForgotModal}
                                        disabled={resetLoading}
                                    >
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.successIcon}>✉️</Text>
                                    <Text style={styles.modalTitle}>Check Your Email</Text>
                                    <Text style={styles.modalSubtitle}>
                                        A password reset link has been sent to{'\n'}
                                        <Text style={styles.emailHighlight}>{resetEmail}</Text>
                                        {'\n\n'}Please check your inbox and follow the link to reset your password.
                                    </Text>
                                    <TouchableOpacity style={styles.button} onPress={closeForgotModal}>
                                        <Text style={styles.buttonText}>Back to Sign In</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
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
        height: 120,
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
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        marginBottom: 24,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#1A1A1A',
    },
    eyeIcon: {
        padding: 4,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginTop: -16,
        marginBottom: 20,
    },
    forgotText: {
        color: '#FF6B00',
        fontSize: 14,
        fontWeight: '600',
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

    // ── Modal styles ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    cancelButton: {
        marginTop: 12,
        alignItems: 'center',
        padding: 12,
    },
    cancelText: {
        color: '#999999',
        fontSize: 14,
        fontWeight: '600',
    },
    successIcon: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 12,
    },
    emailHighlight: {
        color: '#FF6B00',
        fontWeight: '700',
    },
});
