import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { toast } from 'sonner';

export { handleFirestoreError, OperationType };

interface ProfileContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateScores: (category: 'mental' | 'physical' | 'productivity', amount: number) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  isAuthReady: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Instant hydration from LocalStorage for "APK" feel
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('ascend_profile_cache');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        // Cache for next session
        localStorage.setItem('ascend_profile_cache', JSON.stringify(data));
      } else {
        setProfile(null);
        localStorage.removeItem('ascend_profile_cache');
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubProfile();
  }, [user]);

  // Theme effect
  useEffect(() => {
    if (profile?.theme) {
      const root = window.document.documentElement;
      if (profile.theme === 'dark') {
        root.classList.add('dark');
      } else if (profile.theme === 'light') {
        root.classList.remove('dark');
      } else if (profile.theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    }
  }, [profile?.theme]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    const isGuestInit = !user && data.uid === 'config-mode';
    const isGuestUpdate = !user && profile?.uid === 'config-mode';

    if (!user && !isGuestInit && !isGuestUpdate) {
      toast.error("Você precisa estar logado para salvar alterações.");
      return;
    }

    // Filter allowed fields to prevent unauthorized updates
    const allowedKeys: (keyof UserProfile)[] = [
      'displayName', 'photoURL', 'nickname', 'bio', 'aiApproach', 'theme',
      'notifications', 'onboardingComplete', 'routine', 'habits',
      'physicalLevel', 'mentalLevel', 'physicalScore', 'productivityScore', 'goals', 'streak',
      'lastCheckIn', 'interfaceSettings', 'privacySettings', 'currentPlan',
      'planExpiryDate', 'userProfileType', 'financialBalance',
      'lastEmotionalCheckIn', 'fullName', 'cpf', 'phone', 'timeAvailable',
      'xp', 'level', 'missionsCompleted', 'deepAnalysisHistory',
      'evolutionaryProfile', 'pressureMode'
    ];

    const filteredData = Object.keys(data).reduce((acc, key) => {
      if (allowedKeys.includes(key as keyof UserProfile)) {
        (acc as any)[key] = (data as any)[key];
      }
      return acc;
    }, {} as Partial<UserProfile>);

    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), { ...filteredData, uid: user.uid }, { merge: true });
      } else {
        // Guest mode / Config mode update
        setProfile(prev => {
          if (!prev && isGuestInit) return { ...filteredData, uid: 'config-mode' } as UserProfile;
          return prev ? { ...prev, ...filteredData } : null;
        });
      }
      // toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user?.uid || 'guest'}`);
    }
  };

  const updateScores = async (category: 'mental' | 'physical' | 'productivity', amount: number) => {
    if (!profile || !user) return;

    const updates: Partial<UserProfile> = {};
    
    if (category === 'mental') {
      updates.mentalLevel = Math.max(0, Math.min(100, (profile.mentalLevel || 1) + amount));
    } else if (category === 'physical') {
      updates.physicalScore = Math.max(0, Math.min(100, (profile.physicalScore || 10) + amount));
    } else if (category === 'productivity') {
      updates.productivityScore = Math.max(0, Math.min(100, (profile.productivityScore || 45) + amount));
    }

    await updateProfile(updates);
    
    if (amount > 0) {
      toast.success(`+${amount} XP em ${category.toUpperCase()}`);
      await addXP(amount * 5); // XP is 5x the score amount
    } else if (amount < 0) {
      toast.error(`${amount} XP em ${category.toUpperCase()}`);
    }
  };

  const addXP = async (amount: number) => {
    if (!profile || !user) return;

    const currentXP = profile.xp || 0;
    const currentLevel = profile.level || 1;
    const newXP = currentXP + amount;
    const xpToNextLevel = currentLevel * 1000;

    const updates: Partial<UserProfile> = { xp: newXP };

    if (newXP >= xpToNextLevel) {
      updates.level = currentLevel + 1;
      updates.xp = newXP - xpToNextLevel;
      toast.success(`LEVEL UP! Você agora é Nível ${updates.level}`, {
        icon: '🚀',
        duration: 5000
      });
    }

    await updateProfile(updates);
  };

  return (
    <ProfileContext.Provider value={{ user, profile, loading, updateProfile, updateScores, addXP, isAuthReady }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
