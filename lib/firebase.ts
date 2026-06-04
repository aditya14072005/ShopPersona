import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalStoragePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if required environment variables are set
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket
) {
  try {
    // Initialize Firebase (avoid re-initializing on hot reload)
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    // Initialize Firebase services
    auth = getAuth(app);
    // Explicitly persist auth across full-page navigations (e.g. Stripe redirect)
    setPersistence(auth, browserLocalStoragePersistence).catch(() => {});
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.error('Firebase initialization failed:', err);
    // Leave auth, db, storage as null to gracefully handle the error
  }
}

export { auth, db, storage };
export default app;
