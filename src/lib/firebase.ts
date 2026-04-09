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

export function handleAuthError(error: any): string {
  // Log the full error for debugging in the console
  console.error("Firebase Auth Error Details:", {
    code: error.code,
    message: error.message,
    fullError: error
  });

  const code = error.code || (error.message && error.message.includes('auth/') ? error.message.match(/auth\/[a-z-]+/)?.[0] : null);
  
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return "E-mail ou senha incorretos. Verifique seus dados ou crie uma conta.";
    case 'auth/email-already-in-use':
      return "Este e-mail já está em uso. Tente fazer login ou use outro e-mail.";
    case 'auth/invalid-email':
      return "E-mail inválido. Verifique o formato digitado.";
    case 'auth/weak-password':
      return "A senha é muito fraca. Use pelo menos 6 caracteres.";
    case 'auth/too-many-requests':
      return "Muitas tentativas falhas. Tente novamente mais tarde ou recupere sua senha.";
    case 'auth/unauthorized-domain':
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
      const projectId = firebaseConfigFromJson.projectId;
      return `O domínio "${domain}" não está autorizado no projeto Firebase "${projectId}". No Console do Firebase, certifique-se de que você adicionou EXATAMENTE "${domain}" em Autenticação > Configurações > Domínios autorizados para o projeto correto.`;
    case 'auth/popup-closed-by-user':
      return "Login cancelado pelo usuário.";
    case 'auth/network-request-failed':
      return "Erro de rede. Verifique sua conexão com a internet.";
    case 'auth/operation-not-allowed':
      return "Este método de login não está ativado no Console do Firebase.";
    default:
      // If we have a specific message from Firebase but no code, try to make it readable
      if (error.message && error.message.includes('auth/')) {
        return `Erro de autenticação: ${error.message.split('(')[1]?.split(')')[0] || error.message}`;
      }
      return "Ocorreu um erro na autenticação. Por favor, tente novamente.";
  }
}
