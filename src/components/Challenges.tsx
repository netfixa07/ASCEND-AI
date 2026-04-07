import React, { useState, useEffect } from 'react';
import { ActiveChallenge } from '../types';
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generate30DayChallenge } from '../services/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Trophy, Zap, Flame, Target, Star, Shield, Lock, CheckCircle2, Clock, Loader2, ArrowRight, Info, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday, parseISO } from 'date-fns';
import { useProfile } from '../contexts/ProfileContext';

export default function Challenges() {
  const { profile, updateScores } = useProfile();
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAbandonConfirmOpen, setIsAbandonConfirmOpen] = useState(false);
  const [customChallenge, setCustomChallenge] = useState({
    title: '',
    description: '',
    task: '',
    category: 'mental'
  });

  useEffect(() => {
    if (!profile) return;
    const docRef = doc(db, 'activeChallenges', profile.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setActiveChallenge(docSnap.data() as ActiveChallenge);
      } else {
        setActiveChallenge(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `activeChallenges/${profile.uid}`);
    });
    return () => unsubscribe();
  }, [profile?.uid]);

  const acceptChallenge = async (challengeData?: any) => {
    if (!profile) return;
    setLoading(true);
    try {
      let newChallenge: ActiveChallenge;
      
      if (challengeData) {
        // Custom challenge
        newChallenge = {
          uid: profile.uid,
          title: challengeData.title,
          description: challengeData.description,
          startDate: new Date().toISOString(),
          progress: 0,
          tasks: Array(30).fill(challengeData.task),
          category: challengeData.category
        };
      } else {
        // Generated challenge
        const generated = await generate30DayChallenge(profile);
        newChallenge = {
          uid: profile.uid,
          title: generated.title || "Desafio de Ascensão",
          description: generated.description || "30 dias de transformation extrema.",
          startDate: new Date().toISOString(),
          progress: 0,
          tasks: generated.tasks || [],
          category: generated.category || "mental"
        };
      }
      
      await setDoc(doc(db, 'activeChallenges', profile.uid), newChallenge);
      setIsDetailsOpen(false);
      setIsCreateOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `activeChallenges/${profile.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const completeDailyTask = async () => {
    if (!activeChallenge || !profile) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    if (activeChallenge.lastCompletedDate === today) return;

    const newProgress = Math.min(activeChallenge.progress + 1, 30);
    try {
      await updateDoc(doc(db, 'activeChallenges', profile.uid), {
        progress: newProgress,
        lastCompletedDate: today
      });

      // Update scores based on challenge category
      const category = (activeChallenge.category as 'mental' | 'physical' | 'productivity') || 'mental';
      await updateScores(category, 10); // Challenges give more XP
      
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `activeChallenges/${profile.uid}`);
    }
  };

  const abandonChallenge = async () => {
    if (!profile) return;
    try {
      await deleteDoc(doc(db, 'activeChallenges', profile.uid));
      setIsAbandonConfirmOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `activeChallenges/${profile.uid}`);
    }
  };

  const challenges = [
    {
      id: 'c1',
      title: '7 Dias de Fogo',
      description: 'Mantenha um streak de 7 dias sem falhar em nenhuma tarefa.',
      reward: 'Emblema de Fogo + 50 XP Mental',
      progress: (profile.streak / 7) * 100,
      current: profile.streak,
      total: 7,
      icon: <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />,
      status: profile.streak >= 7 ? 'completed' : 'active'
    },
    {
      id: 'c2',
      title: 'Monge da Produtividade',
      description: 'Complete 4 horas de trabalho em foco total por 3 dias seguidos.',
      reward: 'Acesso ao Modo Hardcore + 100 XP Produtividade',
      progress: 33,
      current: 1,
      total: 3,
      icon: <Shield className="w-8 h-8 text-blue-500 fill-blue-500" />,
      status: 'active'
    }
  ];

  if (activeChallenge) {
    const isTaskDoneToday = activeChallenge.lastCompletedDate === format(new Date(), 'yyyy-MM-dd');

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white">
              <Zap className="w-8 h-8 text-blue-500 fill-blue-500" />
              DESAFIO ATIVO
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">Sua jornada de 30 dias está em curso.</p>
          </div>
        </header>

        <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 overflow-hidden border-t-4 border-t-blue-600 shadow-sm">
          <CardHeader className="pb-8">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-blue-600 text-white font-black px-3 py-1">DIA {activeChallenge.progress} / 30</Badge>
              <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">
                <Calendar className="w-4 h-4" /> Iniciado em {activeChallenge.startDate ? format(parseISO(activeChallenge.startDate), 'dd/MM/yyyy') : '---'}
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">{activeChallenge.title}</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
              {activeChallenge.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center gap-8">
              <div className="flex items-center gap-6 w-full">
                <div className="w-20 h-20 rounded-2xl bg-blue-600/5 dark:bg-blue-600/10 flex items-center justify-center border border-blue-500/10 dark:border-blue-500/20 shrink-0">
                  <Target className="w-10 h-10 text-blue-600 dark:text-blue-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Tarefa do Dia {activeChallenge.progress + 1}
                  </p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                    {activeChallenge.tasks?.[activeChallenge.progress] || "Tarefa de evolução."}
                  </p>
                </div>
              </div>

              <div className="w-full p-6 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/10 dark:border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Instrução de Execução</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-bold leading-relaxed">
                  Esta tarefa foi desenhada para atacar suas fraquezas atuais. Execute com precisão máxima. O objetivo é criar consistência inabalável.
                </p>
              </div>

              <Button 
                onClick={completeDailyTask}
                disabled={isTaskDoneToday}
                className={`w-full py-10 rounded-2xl font-black text-2xl transition-all ${
                  isTaskDoneToday 
                    ? 'bg-green-600/10 dark:bg-green-600/20 text-green-600 dark:text-green-500 border border-green-500/10 dark:border-green-500/20 cursor-default' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 hover:scale-[1.02]'
                }`}
              >
                {isTaskDoneToday ? (
                  <span className="flex items-center gap-3"><CheckCircle2 className="w-8 h-8" /> CONCLUÍDO</span>
                ) : (
                  <span className="flex items-center gap-3">MARCAR COMO FEITO <ArrowRight className="w-6 h-6" /></span>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Progresso da Ascensão</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-500">{Math.round((activeChallenge.progress / 30) * 100)}%</span>
              </div>
              <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(activeChallenge.progress / 30) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)] dark:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                />
              </div>
              <div className="grid grid-cols-10 gap-1 pt-2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div 
                    key={`day-${i}`} 
                    className={`h-1.5 rounded-full ${i < activeChallenge.progress ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} 
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button variant="ghost" onClick={() => setIsAbandonConfirmOpen(true)} className="text-zinc-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/10 font-bold">
                Abandonar Desafio
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Abandon Confirmation Dialog */}
        <Dialog open={isAbandonConfirmOpen} onOpenChange={setIsAbandonConfirmOpen}>
          <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-w-md rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-red-500">ABANDONAR DESAFIO</DialogTitle>
              <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                Tem certeza que deseja abandonar este desafio? Todo o seu progresso atual será perdido permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAbandonConfirmOpen(false)} className="border-zinc-200 dark:border-zinc-800 rounded-xl">CANCELAR</Button>
              <Button 
                onClick={abandonChallenge}
                className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl"
              >
                ABANDONAR
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4 text-zinc-900 dark:text-white">
            <Trophy className="w-10 h-10 text-yellow-500" />
            DESAFIOS
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xl">Supere seus limites e desbloqueie novos níveis de performance.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/50 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total de XP Acumulado</span>
            <span className="text-3xl font-black text-zinc-900 dark:text-white">2,450 XP</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 h-full flex flex-col group hover:border-blue-500/50 transition-all duration-300 shadow-sm border-dashed border-2">
            <CardHeader className="flex flex-row items-center gap-5 pb-6">
              <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 shrink-0">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white">Criar Desafio</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                  Defina suas próprias regras e conquiste seus objetivos em 30 dias.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end pt-4">
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-xl shadow-lg shadow-blue-600/20"
              >
                CRIAR PERSONALIZADO
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {challenges.map((challenge, i) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 h-full flex flex-col group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-5 pb-6">
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 group-hover:border-zinc-200 dark:group-hover:border-zinc-700 transition-all shrink-0">
                  {challenge.icon}
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white">{challenge.title}</CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                    {challenge.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-400 dark:text-zinc-500">Progresso Atual</span>
                    <span className="text-zinc-900 dark:text-white">{challenge.current} / {challenge.total}</span>
                  </div>
                  <Progress value={challenge.progress} className="h-2.5 bg-zinc-100 dark:bg-zinc-900" />
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{challenge.reward}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setSelectedChallenge(challenge); setIsDetailsOpen(true); }}
                    className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-bold rounded-xl px-4"
                  >
                    <Info className="w-4 h-4 mr-2" /> Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-blue-600 to-blue-900 border-none overflow-hidden relative shadow-2xl shadow-blue-600/20 rounded-[2.5rem]">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Trophy className="w-64 h-64 text-white" />
        </div>
        <CardContent className="p-12 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center lg:text-left">
            <Badge className="bg-white/20 text-white border-none font-black uppercase tracking-[0.2em] px-4 py-1.5">Evento Especial</Badge>
            <h2 className="text-5xl font-black text-white tracking-tighter leading-none">
              DESAFIO DA ASCENSÃO <br /> SUPREMA (30 DIAS)
            </h2>
            <p className="text-blue-100 text-xl max-w-xl font-medium leading-relaxed">
              O teste definitivo de disciplina. 30 dias de tarefas personalizadas baseadas no seu diagnóstico. Apenas para os 1% mais resilientes.
            </p>
            <Button 
              onClick={() => acceptChallenge()}
              disabled={loading}
              className="bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all font-black px-12 py-8 rounded-2xl shadow-2xl text-xl"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <span className="flex items-center gap-3">ACEITAR DESAFIO <Zap className="w-6 h-6 fill-blue-600" /></span>
              )}
            </Button>
          </div>
          <div className="flex flex-col gap-4 shrink-0">
            <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10 text-center min-w-[160px]">
              <p className="text-4xl font-black text-white">124</p>
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mt-1">Participantes</p>
            </div>
            <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10 text-center min-w-[160px]">
              <p className="text-4xl font-black text-white">12d</p>
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mt-1">Restantes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">CRIAR DESAFIO</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Personalize sua jornada de 30 dias.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Título do Desafio</Label>
              <input 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 30 Dias de Código"
                value={customChallenge.title}
                onChange={(e) => setCustomChallenge({...customChallenge, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Descrição</Label>
              <textarea 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="Qual o objetivo deste desafio?"
                value={customChallenge.description}
                onChange={(e) => setCustomChallenge({...customChallenge, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Tarefa Diária (Repetitiva)</Label>
              <textarea 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="O que você fará todos os dias?"
                value={customChallenge.task}
                onChange={(e) => setCustomChallenge({...customChallenge, task: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Categoria</Label>
              <select 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={customChallenge.category}
                onChange={(e) => setCustomChallenge({...customChallenge, category: e.target.value})}
              >
                <option value="mental">Mental</option>
                <option value="physical">Físico</option>
                <option value="productivity">Produtividade</option>
                <option value="financial">Financeiro</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => acceptChallenge(customChallenge)}
              disabled={!customChallenge.title || !customChallenge.task || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'INICIAR DESAFIO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              {selectedChallenge?.icon}
              {selectedChallenge?.title}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-lg pt-4">
              {selectedChallenge?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Recompensa</p>
              <p className="text-zinc-900 dark:text-white font-bold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {selectedChallenge?.reward}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Regras do Desafio</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" /> Consistência diária obrigatória.
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" /> Falha em um dia reseta o progresso.
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-xl">
              ENTENDIDO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
