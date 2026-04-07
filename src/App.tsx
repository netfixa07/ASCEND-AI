import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, logOut, handleFirestoreError, OperationType } from './lib/firebase';
import { useProfile } from './contexts/ProfileContext';
import { useAscendElite } from './hooks/useAscendElite';
import Onboarding from './components/Onboarding';
import Pricing from './components/Pricing';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DailyPlanView from './components/DailyPlan';
import MentorChat from './components/MentorChat';
import Evolution from './components/Evolution';
import Challenges from './components/Challenges';
import FinanceTracker from './components/FinanceTracker';
import FocusMode from './components/FocusMode';
import EmotionalSupport from './components/EmotionalSupport';
import GoalPlanner from './components/GoalPlanner';
import DeepAnalysis from './components/DeepAnalysis';
import FutureSimulator from './components/FutureSimulator';
import MissionsSystem from './components/MissionsSystem';
import EvolutionaryProfile from './components/EvolutionaryProfile';
import PsychologistIA from './components/PsychologistIA';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Tabs, TabsContent } from './components/ui/tabs';
import { Zap, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TooltipProvider } from './components/ui/tooltip';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { Logo } from './components/Logo';

export default function App() {
  const { user, profile, loading, updateProfile } = useProfile();
  const { todayPlan } = useAscendElite();
  const [hasStarted, setHasStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isViewingPlans, setIsViewingPlans] = useState(false);
  const [pendingMentorMessage, setPendingMentorMessage] = useState<string | null>(null);

  // Auto-start if user is already logged in and profile is loaded
  useEffect(() => {
    if (user && profile && !hasStarted) {
      setHasStarted(true);
    }
  }, [user, profile, hasStarted]);

  const handleAuthComplete = () => {
    // Auth component handles login/signup. 
    // App will react to user/profile changes.
  };

  const handleOnboardingComplete = async (data: any) => {
    if (user) {
      try {
        await updateProfile({ 
          ...data,
          onboardingComplete: true 
        });
      } catch (error: any) {
        console.error("Error saving onboarding:", error);
      }
    }
  };

  const handleSelectPlan = async (plan: string) => {
    if (user) {
      try {
        await updateProfile({ currentPlan: plan });
        setIsViewingPlans(false);
      } catch (error) {
        // Error handled in updateProfile
      }
    }
  };

  const handleBackToPlans = () => {
    setIsViewingPlans(true);
  };

  const isPremium = profile?.currentPlan === 'Plano Pro' || profile?.currentPlan === 'Plano Elite';

  // Notification Simulation
  useEffect(() => {
    if (!profile?.notifications?.enabled) return;

    const challengeTimer = setTimeout(() => {
      if (profile.notifications?.challenges) {
        toast("Desafio Pendente!", {
          description: "Você ainda não concluiu seu desafio de hoje. A ascensão exige constância!",
          icon: <Bell className="w-4 h-4 text-orange-500" />,
        });
      }
    }, 30000);

    const aiTimer = setTimeout(() => {
      if (profile.notifications?.aiAlerts) {
        toast("Insight do Mentor", {
          description: "Notei um padrão na sua produtividade matinal. Vamos ajustar sua rotina?",
          icon: <Zap className="w-4 h-4 text-blue-500" />,
        });
      }
    }, 60000);

    return () => {
      clearTimeout(challengeTimer);
      clearTimeout(aiTimer);
    };
  }, [profile?.uid, profile?.notifications]);

  // --- RENDERING LOGIC (DETERMINISTIC FLOW) ---

  // 0. Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Toaster position="top-right" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <Logo showText={true} size="lg" />
        </motion.div>
      </div>
    );
  }

  // 1. Intro Screen
  if (!hasStarted && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
        <Toaster position="top-right" />
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md space-y-8"
        >
          <div className="flex justify-center">
            <Logo showText={false} size="xl" className="shadow-[0_0_50px_rgba(37,99,235,0.3)]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase">ASCEND AI</h1>
            <p className="text-zinc-400 text-lg font-medium">
              Disciplina cria liberdade. Transformação de alta performance começa aqui.
            </p>
          </div>
          <button 
            onClick={() => setHasStarted(true)} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 text-xl rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            INICIAR ASCENSÃO
          </button>
          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-500">
            <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-950/50">
              <h3 className="font-bold text-zinc-300 uppercase text-xs tracking-widest mb-1">MENTOR ELITE</h3>
              <p>IA treinada para alta performance.</p>
            </div>
            <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-950/50">
              <h3 className="font-bold text-zinc-300 uppercase text-xs tracking-widest mb-1">EVOLUÇÃO REAL</h3>
              <p>Planos adaptados à sua realidade.</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Auth Screen
  if (!user) {
    return (
      <>
        <Toaster position="top-right" />
        <Auth onComplete={handleAuthComplete} onBack={() => setHasStarted(false)} />
      </>
    );
  }

  // 3. Wait for Profile to Sync (Only if not cached)
  if (!profile && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Toaster position="top-right" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <Logo showText={false} size="md" />
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">Sincronizando Perfil...</p>
        </motion.div>
      </div>
    );
  }

  // 4. Handle missing profile after sync
  if (!profile && !loading) {
    // If we're not loading and still have no profile, it's a new user
    return (
      <>
        <Toaster position="top-right" />
        <Onboarding 
          user={user} 
          onComplete={handleOnboardingComplete} 
          onCancel={() => {
            setHasStarted(false);
            logOut();
          }}
        />
      </>
    );
  }

  // 4. Diagnosis (Onboarding) - Conditional
  if (!profile.onboardingComplete) {
    return (
      <>
        <Toaster position="top-right" />
        <Onboarding 
          user={user} 
          onComplete={handleOnboardingComplete} 
          onCancel={() => {
            setHasStarted(false);
            logOut();
          }}
        />
      </>
    );
  }

  // 5. Pricing (Plans) - Mandatory if no plan OR if explicitly viewing OR if accessing premium feature without plan
  const needsPlan = !profile.currentPlan;
  const psychologistNeedsPlan = activeTab === 'psychologist' && !isPremium;

  if (needsPlan || isViewingPlans || psychologistNeedsPlan) {
    return (
      <Pricing 
        onSelectPlan={handleSelectPlan} 
        onBack={() => {
          if (isViewingPlans || (psychologistNeedsPlan && profile.currentPlan)) {
            setIsViewingPlans(false);
            if (psychologistNeedsPlan) {
              setActiveTab('dashboard');
            }
          } else {
            // Mandatory flow - go back to Intro/Logout
            setHasStarted(false);
            logOut();
          }
        }} 
      />
    );
  }

  // 6. Main Dashboard
  return (
    <TooltipProvider>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white flex flex-col lg:flex-row relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row w-full h-full min-h-screen">
          <Sidebar profile={profile} activeTab={activeTab} onTabChange={setActiveTab} onBackToPlans={handleBackToPlans} />

          <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-black relative min-h-screen">
            <Topbar profile={profile} />
            
            <main className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_50%)] pointer-events-none" />
              <AnimatePresence mode="wait">
                <TabsContent key="dashboard" value="dashboard" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Dashboard />
                  </motion.div>
                </TabsContent>
                <TabsContent key="plan" value="plan" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <DailyPlanView />
                  </motion.div>
                </TabsContent>
                <TabsContent key="chat" value="chat" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 h-full min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-full">
                    <MentorChat initialMessage={pendingMentorMessage} onMessageConsumed={() => setPendingMentorMessage(null)} />
                  </motion.div>
                </TabsContent>
                <TabsContent key="deep-analysis" value="deep-analysis" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <DeepAnalysis />
                  </motion.div>
                </TabsContent>
                <TabsContent key="future" value="future" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <FutureSimulator />
                  </motion.div>
                </TabsContent>
                <TabsContent key="missions" value="missions" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <MissionsSystem />
                  </motion.div>
                </TabsContent>
                <TabsContent key="profile-evolution" value="profile-evolution" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <EvolutionaryProfile />
                  </motion.div>
                </TabsContent>
                <TabsContent key="evolution" value="evolution" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Evolution />
                  </motion.div>
                </TabsContent>
                <TabsContent key="challenges" value="challenges" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Challenges />
                  </motion.div>
                </TabsContent>
                <TabsContent key="finance" value="finance" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <FinanceTracker />
                  </motion.div>
                </TabsContent>
                <TabsContent key="psychologist" value="psychologist" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <PsychologistIA />
                  </motion.div>
                </TabsContent>
                <TabsContent key="focus" value="focus" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <FocusMode />
                  </motion.div>
                </TabsContent>
                <TabsContent key="emotional" value="emotional" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <EmotionalSupport onTalkToMentor={(msg) => {
                      setPendingMentorMessage(msg);
                      setActiveTab('chat');
                    }} />
                  </motion.div>
                </TabsContent>
                <TabsContent key="goals" value="goals" className="m-0 focus-visible:outline-none p-4 sm:p-6 md:p-10 lg:p-12 min-h-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <GoalPlanner />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </main>
          </div>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
