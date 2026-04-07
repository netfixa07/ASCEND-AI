import React, { useState, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { generateMissions } from '../services/gemini';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Mission } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Trophy, Target, Zap, CheckCircle2, Circle, Star, Sparkles, Loader2, Gamepad2, TrendingUp, ShieldCheck, Calendar as CalendarIcon, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export default function MissionsSystem() {
  const { profile, updateScores, addXP, updateProfile } = useProfile();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'missions'),
      where('uid', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
      setMissions(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'missions');
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleGenerateMissions = async () => {
    if (!profile) return;
    setGenerating(true);
    try {
      // Check if user already has active missions
      const activeMissions = missions.filter(m => !m.completed);
      if (activeMissions.length >= 3) {
        toast.error("Você já tem missões ativas. Conclua-as primeiro!");
        return;
      }

      const newMissionsData = await generateMissions(profile);
      for (const m of newMissionsData) {
        await addDoc(collection(db, 'missions'), {
          ...m,
          uid: profile.uid,
          completed: false,
          createdAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h deadline
        });
      }
      toast.success("Novas missões estratégicas geradas!");
    } catch (error) {
      toast.error("Erro ao gerar missões.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteMission = async (mission: Mission) => {
    if (!mission.id) return;
    try {
      await updateDoc(doc(db, 'missions', mission.id), {
        completed: true
      });

      // Award XP and update productivity score
      await addXP(mission.xp);
      await updateScores('productivity', 5);
      await updateProfile({ 
        missionsCompleted: (profile?.missionsCompleted || 0) + 1 
      });
      toast.success(`Missão concluída! +${mission.xp} XP`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'missions');
    }
  };

  const userLevel = profile?.level || 1;
  const userXP = profile?.xp || 0;
  const xpToNextLevel = userLevel * 1000;
  const progress = (userXP / xpToNextLevel) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-2xl">
              <Gamepad2 className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
              Missões Estratégicas
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xl font-medium">
            Ações objetivas desenhadas pela IA para atacar suas fraquezas e acelerar sua evolução.
          </p>
        </div>
        <Button 
          onClick={handleGenerateMissions}
          disabled={generating}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl px-10 py-8 shadow-2xl hover:scale-105 transition-all text-lg"
        >
          {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 mr-3 fill-current text-yellow-500" />}
          GERAR NOVAS MISSÕES
        </Button>
      </header>

      {/* User Level Card */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
        <CardContent className="p-12 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                  <span className="text-5xl font-black text-zinc-900">{userLevel}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 p-3 bg-zinc-800 rounded-2xl border-4 border-zinc-900">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Nível {userLevel}</h2>
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Ascensão Contínua</p>
              </div>
            </div>

            <div className="flex-1 max-w-md w-full space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Progresso do Nível</span>
                <span className="text-white font-black">{userXP} / {xpToNextLevel} XP</span>
              </div>
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden p-1">
                <motion.div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Missions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {missions.filter(m => !m.completed).map((mission) => (
            <motion.div
              key={mission.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group h-full flex flex-col">
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                      <Target className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 font-black">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">{mission.xp} XP</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase leading-tight">
                    {mission.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                      <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm leading-relaxed">
                        {mission.description}
                      </p>
                    </div>
                    
                    {mission.objective && (
                      <div className="p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/10 dark:border-blue-500/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-3 h-3 text-blue-500" />
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Objetivo Estratégico</div>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-bold leading-relaxed">{mission.objective}</p>
                      </div>
                    )}

                    {mission.benefit && (
                      <div className="p-4 bg-green-500/5 dark:bg-green-500/10 rounded-2xl border border-green-500/10 dark:border-green-500/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <div className="text-[10px] font-black text-green-500 uppercase tracking-widest">Ganho de Performance</div>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-bold leading-relaxed">{mission.benefit}</p>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleCompleteMission(mission)}
                    className="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-all"
                  >
                    CONCLUIR MISSÃO
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {missions.filter(m => !m.completed).length === 0 && !loading && (
          <div className="md:col-span-3 py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10 text-zinc-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Sem missões ativas</h3>
              <p className="text-zinc-500 font-bold">Gere novas missões estratégicas para continuar evoluindo.</p>
            </div>
          </div>
        )}
      </div>

      {/* Completed Missions History */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-500" />
          Histórico de Conquistas
        </h3>
        <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden rounded-[2rem]">
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              <Table className="min-w-[800px]">
                <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10">
                  <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Missão</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Status</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Data de Conclusão</TableHead>
                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-zinc-400">Recompensa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.filter(m => m.completed).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-zinc-500 font-medium">
                        Nenhuma missão concluída ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    missions.filter(m => m.completed).slice(0, 10).map((mission) => (
                      <TableRow key={mission.id} className="group border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <TableCell className="font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-xl">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            {mission.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-widest">
                            <Award className="w-3 h-3" />
                            Concluída
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2 text-zinc-500">
                            <CalendarIcon className="w-3 h-3" />
                            <span className="text-xs">{mission.createdAt ? format(new Date(mission.createdAt), 'dd/MM/yyyy') : 'Recentemente'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 text-yellow-500 font-black text-sm">
                            <Star className="w-3 h-3 fill-current" />
                            +{mission.xp} XP
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
