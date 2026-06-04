'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User 
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setError('Firebase not configured. Please check your environment variables.');
      return;
    }

    // onAuthStateChanged fires once with null while Firebase rehydrates from
    // IndexedDB, then again with the real user. We must not act on the first
    // null — keep loading=true until Firebase fully resolves.
    let resolved = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setError(null);

        if (firebaseUser) {
          setUser(firebaseUser);
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          } else {
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              role: 'user',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, defaultProfile);
            setUserProfile(defaultProfile);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
      } finally {
        resolved = true;
        setLoading(false);
      }
    });

    // Safety timeout — if Firebase never fires (e.g. offline), unblock UI after 5s
    const timeout = setTimeout(() => {
      if (!resolved) setLoading(false);
    }, 5000);

    return () => { unsubscribe(); clearTimeout(timeout); };
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: newUser.uid,
        email: newUser.email || '',
        name: name,
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', newUser.uid), userProfile);
      setUserProfile(userProfile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      // Check if user profile exists
      const userDocRef = doc(db, 'users', googleUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create user profile for new Google users
        const userProfile: UserProfile = {
          uid: googleUser.uid,
          email: googleUser.email || '',
          name: googleUser.displayName || 'User',
          role: 'user',
          createdAt: new Date().toISOString(),
          avatar: googleUser.photoURL || undefined,
        };
        await setDoc(userDocRef, userProfile);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout,
    isAdmin: userProfile?.role === 'admin' ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
