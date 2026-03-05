import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

/**
 * Sign Up with Email and Password
 */
export const signUp = async (email: string, password: string, name?: string): Promise<{ session: Session | null; error: any }> => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        // Save name to users table if provided and user was created
        if (!error && data.user && name) {
            await supabase
                .from('users')
                .update({ name })
                .eq('id', data.user.id);
        }

        return { session: data.session, error };
    } catch (error: any) {
        console.error('Error signing up:', error);
        return { session: null, error };
    }
};

/**
 * Sign In with Email and Password
 */
export const signIn = async (email: string, password: string): Promise<{ session: Session | null; error: any }> => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { session: data.session, error };
    } catch (error: any) {
        console.error('Error signing in:', error);
        return { session: null, error };
    }
};

/**
 * Get or create user document in Supabase
 */
export const getUserData = async (userId: string, email?: string): Promise<User | null> => {
    const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching user data:', error);
        return null;
    }

    if (userProfile) {
        return {
            id: userProfile.id,
            email: userProfile.email || '',
            role: userProfile.role as UserRole,
            name: userProfile.name,
            address: userProfile.address,
            createdAt: new Date(userProfile.created_at),
        };
    }

    // Fallback: If profile doesn't exist, create it (Trigger might have failed)
    if (email) {
        console.log('DEBUG: User profile not found, creating one for:', userId);
        const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert([{
                id: userId,
                email: email,
                role: 'customer'
            }])
            .select()
            .single();

        if (createError) {
            console.error('Error creating user default profile:', createError);
            return null;
        }

        return {
            id: newProfile.id,
            email: newProfile.email || '',
            role: newProfile.role as UserRole,
            name: newProfile.name,
            address: newProfile.address,
            createdAt: new Date(newProfile.created_at),
        };
    }

    return null;
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (userId: string, role: UserRole): Promise<{ error: any }> => {
    const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

    return { error };
};

/**
 * Update customer profile (name, address)
 */
export const updateUserProfile = async (
    userId: string,
    updates: { name?: string; address?: string }
): Promise<{ error: any }> => {
    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

    return { error };
};

/**
 * Reset Password via Email
 */
export const resetPassword = async (email: string): Promise<{ error: any }> => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'buildmate://reset-password',
        });
        return { error };
    } catch (error: any) {
        console.error('Error sending password reset email:', error);
        return { error };
    }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<{ error: any }> => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback: (session: Session | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });

    return () => subscription.unsubscribe();
};
