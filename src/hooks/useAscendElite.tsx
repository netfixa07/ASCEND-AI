import { useEffect, useState } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { doc, onSnapshot, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DailyPlan } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Zap, AlertTriangle, Trophy } from 'lucide-react';
import { updateEvolutionaryProfile } from '../services/gemini';

export function useAscendElite() {
  const { user, profile, updateProfile } = useProfile();
  const [todayPlan, setTodayPlan] = useState<DailyPlan | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Listen to today's plan
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'dailyPlans', `${user.uid}_${today}`);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTodayPlan(docSnap.data() as DailyPlan);
      }
    });
    return () => unsubscribe();
  }, [user, today]);

  // Active Pressure Logic
  useEffect(() => {
    if (!profile?.pressureMode?.active || !todayPlan) return;

    const incompleteTasks = todayPlan.tasks.filter(t => !t.completed);
    const totalTasks = todayPlan.tasks.length;
    
    if (totalTasks === 0) return;

    const progress = (todayPlan.completedCount / totalTasks) * 100;
    const currentHour = new Date().getHours();

    // Trigger pressure if progress is low and it's late in the day
    if (currentHour >= 14 && progress < 30) {
      const intensity = profile.pressureMode.intensity;
      let message = "Você está atrasado com suas metas. A ascensão exige consistência!";
      
      if (intensity === 'hardcore') {
        message = "SEM DESCULPAS! Suas metas estão paradas e o tempo está acabando. MOVA-SE!";
      } else if (intensity === 'high') {
        message = "Atenção: Seu progresso está abaixo do esperado. Retome o foco agora.";
      }

      // Only toast once per session or use a timestamp to avoid spam
      const lastPressure = localStorage.getItem('last_pressure_toast');
      const now = Date.now();
      if (!lastPressure || now - parseInt(lastPressure) > 1000 * 60 * 60 * 4) { // 4 hours
        toast("MODO PRESSÃO ATIVO", {
          description: message,
          icon: <Zap className="w-4 h-4 text-red-500 fill-red-500" />,
          duration: 6000,
        });
        localStorage.setItem('last_pressure_toast', now.toString());
      }
    }
  }, [profile?.pressureMode, todayPlan]);

  // Automated Profile Update Logic
  useEffect(() => {
    if (!profile || !user) return;

    const missionsCompleted = profile.missionsCompleted || 0;
    const lastUpdate = profile.evolutionaryProfile?.lastUpdate;
    const now = Date.now();
    
    // Update profile every 5 missions or every 3 days
    const shouldUpdate = !lastUpdate || 
                         (missionsCompleted > 0 && missionsCompleted % 5 === 0) ||
                         (now - new Date(lastUpdate).getTime() > 1000 * 60 * 60 * 24 * 3);

    if (shouldUpdate && missionsCompleted > 0) {
      const triggerUpdate = async () => {
        try {
          const actionsQuery = query(
            collection(db, 'dailyPlans'),
            where('uid', '==', user.uid),
            orderBy('date', 'desc'),
            limit(7)
          );
          const snapshot = await getDocs(actionsQuery);
          const recentActions = snapshot.docs.map(doc => doc.data());

          const updatedProfile = await updateEvolutionaryProfile(profile, recentActions);
          if (updatedProfile) {
            await updateProfile({
              evolutionaryProfile: {
                ...updatedProfile,
                lastUpdate: new Date().toISOString()
              }
            });
            toast("Perfil Evolutivo Atualizado", {
              description: `Sua nova classificação: ${updatedProfile.classification}`,
              icon: <Trophy className="w-4 h-4 text-indigo-500" />,
            });
          }
        } catch (error) {
          console.error("Auto profile update failed:", error);
        }
      };
      
      // Debounce or check again to avoid infinite loops
      const lastAutoUpdate = localStorage.getItem('last_auto_profile_update');
      if (!lastAutoUpdate || now - parseInt(lastAutoUpdate) > 1000 * 60 * 60 * 24) {
        triggerUpdate();
        localStorage.setItem('last_auto_profile_update', now.toString());
      }
    }
  }, [profile?.missionsCompleted, user?.uid]);

  return { todayPlan };
}
