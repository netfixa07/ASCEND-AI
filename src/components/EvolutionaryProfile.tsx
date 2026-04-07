import React, { useState, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { updateEvolutionaryProfile } from '../services/gemini';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { User, Activity, Target, Zap, Shield, Sparkles, Loader2, RefreshCw, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function EvolutionaryProfile() {
  const { profile, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [evolutionData, setEvolutionData] = useState<any>(profile?.evolutionaryProfile || null);

  const [updatingPressure, setUpdatingPressure] = useState(false);

  const togglePressure = async () => {
    if (!profile) return;
    setUpdatingPressure(true);
    try {
      const currentMode = profile.pressureMode || { intensity: 'low', active: false };
      await updateProfile({ 
        pressureMode: { 
          ...currentMode, 
          active: !currentMode.active 
        } 
      });
      toast.success(currentMode.active ? "Modo pressão desativado." : "MODO PRESSÃO ATIVADO!");
    } catch (error) {
      toast.error("Erro ao atualizar modo pressão.");
    } finally {
      setUpdatingPressure(false);
    }
  };

  const setIntensity = async (level: 'low' | 'medium' | 'high' | 'hardcore') => {
    if (!profile) return;
    setUpdatingPressure(true);
    try {
      const currentMode = profile.pressureMode || { intensity: 'low', active: false };
      await updateProfile({ 
        pressureMode: { 
          ...currentMode, 
          intensity: level,
          active: true // Auto-activate when changing intensity
        } 
      });
      toast.success(`Intensidade ajustada para ${level.toUpperCase()}`);
    } catch (error) {
      toast.error("Erro ao ajustar intensidade.");
    } finally {
      setUpdatingPressure(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Fetch recent actions to analyze
      const actionsQuery = query(
        collection(db, 'dailyPlans'),
        where('uid', '==', profile.uid),
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
        setEvolutionData(updatedProfile);
        toast.success("Perfil evolutivo atualizado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar perfil evolutivo.");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Consistência', value: evolutionData?.consistency || 0, color: 'bg-green-500', icon: <Activity className="w-4 h-4" /> },
    { label: 'Foco', value: evolutionData?.focus || 0, color: 'bg-blue-500', icon: <Target className="w-4 h-4" /> },
    { label: 'Impulsividade', value: evolutionData?.impulsivity || 0, color: 'bg-red-500', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <User className="w-8 h-8 text-indigo-500" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
              Perfil Evolutivo
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xl font-medium">
            Sua identidade em constante transformação. A IA analisa suas ações e ajusta sua jornada.
          </p>
        </div>
        <Button 
          onClick={handleUpdateProfile}
          disabled={loading}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl px-10 py-8 shadow-2xl hover:scale-105 transition-all text-lg"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6 mr-3" />}
          ATUALIZAR PERFIL
        </Button>
      </header>

      {!evolutionData ? (
        <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[3rem] overflow-hidden">
          <CardContent className="p-20 text-center space-y-8">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-12 h-12 text-zinc-400" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                Identidade Evolutiva
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md mx-auto">
                Clique em atualizar para que a IA analise seu comportamento recente e defina seu perfil atual.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Classification Card */}
          <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
            <CardContent className="p-12 space-y-12">
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                  <Shield className="w-16 h-16 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="text-indigo-400 font-black uppercase tracking-widest text-[10px]">Classificação Atual</div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-tight">
                    {evolutionData.classification}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {stats.map((stat, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2 text-zinc-500 font-black uppercase tracking-widest text-[10px]">
                        {stat.icon}
                        {stat.label}
                      </div>
                      <span className="text-xl font-black text-white">{stat.value}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${stat.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        transition={{ delay: i * 0.1, duration: 1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-zinc-800/50 rounded-3xl border border-zinc-700/50 flex gap-6">
                <div className="p-4 bg-indigo-500/10 rounded-2xl h-fit">
                  <Info className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="space-y-2">
                  <div className="text-indigo-400 font-black uppercase tracking-widest text-[10px]">Feedback do Mentor</div>
                  <p className="text-zinc-300 font-bold leading-relaxed">
                    {evolutionData.feedback}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pressure Mode Card */}
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-10 pb-4">
              <div className="flex items-center gap-3 text-red-500 font-black uppercase tracking-widest text-xs">
                <Zap className="w-5 h-5 fill-current" />
                Modo Pressão Inteligente
              </div>
              <CardTitle className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white uppercase leading-tight">
                Disciplina Forçada
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-4 space-y-8">
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm leading-relaxed">
                Ative a cobrança estratégica da IA. O mentor será mais duro e exigente com seus resultados.
              </p>

              <div className="space-y-4">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Intensidade</div>
                <div className="grid grid-cols-2 gap-2">
                  {['low', 'medium', 'high', 'hardcore'].map((level) => (
                    <Button
                      key={level}
                      variant={profile?.pressureMode?.intensity === level ? 'default' : 'outline'}
                      onClick={() => setIntensity(level as any)}
                      disabled={updatingPressure}
                      className={`capitalize rounded-xl font-bold h-12 ${profile?.pressureMode?.intensity === level ? 'bg-red-600 hover:bg-red-700 text-white border-none' : ''}`}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={togglePressure}
                disabled={updatingPressure}
                className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                  profile?.pressureMode?.active 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-none shadow-[0_0_30px_rgba(220,38,38,0.3)]' 
                    : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                }`}
              >
                {updatingPressure ? <Loader2 className="w-5 h-5 animate-spin" /> : (profile?.pressureMode?.active ? 'DESATIVAR PRESSÃO' : 'ATIVAR PRESSÃO')}
              </Button>

              <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest justify-center">
                <AlertCircle className="w-4 h-4" />
                Cuidado: O modo hardcore não aceita desculpas.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
