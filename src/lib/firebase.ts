import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import firebaseConfigFromJson from '../../firebase-applet-config.json';

// Helper to get env var or fallback, ensuring empty strings are treated as undefined
const getEnv = (val: string | undefined, fallback: string) => {
  return (val && val.trim() !== "") ? val.trim() : fallback;
};

// Use the JSON config directly to ensure reliability
const firebaseConfig = {
  apiKey: firebaseConfigFromJson.apiKey,
  authDomain: firebaseConfigFromJson.authDomain,
  projectId: firebaseConfigFromJson.projectId,
  storageBucket: firebaseConfigFromJson.storageBucket,
  messagingSenderId: firebaseConfigFromJson.messagingSenderId,
  appId: firebaseConfigFromJson.appId,
  measurementId: firebaseConfigFromJson.measurementId,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("TODO")) {
  console.warn("Firebase API Key is missing or invalid. Authentication may fail.");
}

const app = initializeApp(firebaseConfig);
// Use the database ID from JSON config
const firestoreDatabaseId = firebaseConfigFromJson.firestoreDatabaseId;

// Initialize Firestore with persistent cache (replacing deprecated enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
}, firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const registerWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const logOut = () => signOut(auth);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
