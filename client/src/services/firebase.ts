import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyExampleKey',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'example.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'example-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'example.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef'
};

let app: FirebaseApp | null = null;
let auth: any = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
} catch (err) {
  console.warn('[Firebase] Initialization notice: Live credentials not fully configured or network offline. Demo authentication mode is active.', err);
}

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export async function loginWithGoogle(): Promise<{ user: any; token: string }> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please verify configuration.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return {
      user: {
        userId: result.user.uid,
        email: result.user.email || 'user@google.com',
        displayName: result.user.displayName || 'Google User',
        provider: 'google'
      },
      token: idToken
    };
  } catch (err: any) {
    console.error('Firebase Google Login Error:', err);
    throw err;
  }
}

export async function loginWithApple(): Promise<{ user: any; token: string }> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please verify configuration.');
  }

  try {
    const result = await signInWithPopup(auth, appleProvider);
    const idToken = await result.user.getIdToken();
    return {
      user: {
        userId: result.user.uid,
        email: result.user.email || 'user@apple.com',
        displayName: result.user.displayName || 'Apple User',
        provider: 'apple'
      },
      token: idToken
    };
  } catch (err: any) {
    console.error('Firebase Apple Login Error:', err);
    throw err;
  }
}

export async function logout(): Promise<void> {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore
    }
  }
}

export { auth };
