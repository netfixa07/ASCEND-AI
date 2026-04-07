import React, { useState, useEffect } from 'react';
import { DailyPlan, Task } from '../types';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateDailyPlan } from '../services/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Zap, Calendar, CheckCircle2, Clock, Brain, Dumbbell, Coffee, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from '../contexts/ProfileContext';

export default function DailyPlanView() {
  const { profile, updateScores } = useProfile();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!profile) return;
    const docRef = doc(db, 'dailyPlans', `${profile.uid}_${today}`);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlan(docSnap.data() as DailyPlan);
      } else {
        setPlan(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `dailyPlans/${profile.uid}_${today}`);
    });
    return () => unsubscribe();
  }, [profile?.uid, today]);

  const createPlan = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const generated = await generateDailyPlan(profile);
      const newPlan: DailyPlan = {
        uid: profile.uid,
        date: today,
        tasks: generated.tasks.map((t: any, i: number) => ({
          ...t,
          id: `task_${i}`,
          completed: false
        })),
        aiFeedback: generated.aiFeedback,
        completedCount: 0
      };
      await setDoc(doc(db, 'dailyPlans', `${profile.uid}_${today}`), newPlan);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `dailyPlans/${profile.uid}_${today}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!plan || !profile) return;
    
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompleting = !task.completed;
    const updatedTasks = plan.tasks.map(t => 
      t.id === taskId ? { ...t, completed: isCompleting } : t
    );
    const completedCount = updatedTasks.filter(t => t.completed).length;
    
    try {
      await updateDoc(doc(db, 'dailyPlans', `${profile.uid}_${today}`), {
        tasks: updatedTasks,
        completedCount
      });

      // Update scores based on category
      const amount = isCompleting ? 5 : -5;
      if (task.category === 'mental') await updateScores('mental', amount);
      else if (task.category === 'physical') await updateScores('physical', amount);
      else if (task.category === 'productivity') await updateScores('productivity', amount);
      
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `dailyPlans/${profile.uid}_${today}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mental': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'physical': return <Dumbbell className="w-4 h-4 text-red-500" />;
      case 'productivity': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'rest': return <Coffee className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };

  const progress = plan ? (plan.completedCount / (plan.tasks?.length || 1)) * 100 : 0;
  const isPlanCompleted = plan && plan.tasks?.length > 0 && plan.tasks.every(t => t.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white">
            <Calendar className="w-8 h-8 text-blue-500" />
            PLANO DO DIA
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        {!plan && !loading && (
          <Button 
            onClick={createPlan} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-blue-600/20"
          >
            GERAR PLANO ESTRATÉGICO <Zap className="ml-2 w-5 h-5 fill-white" />
          </Button>
        )}
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-zinc-400 font-bold animate-pulse">O MENTOR ESTÁ ANALISANDO SUA ROTINA...</p>
        </div>
      )}

      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {isPlanCompleted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border-2 border-green-500/20 rounded-[2rem] p-12 text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tighter text-green-600 dark:text-green-400">
                    PARABÉNS!
                  </h2>
                  <p className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
                    Você concluiu seu plano diário.
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Amanhã, a IA estabelecerá um novo plano diário para você.
                  </p>
                </div>
              </motion.div>
            ) : (
              <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Checklist de Execução</CardTitle>
                    <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {plan.completedCount} / {plan.tasks?.length || 0} CONCLUÍDOS
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2 bg-zinc-100 dark:bg-zinc-900 mt-4" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {plan.tasks?.map((task, i) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors ${task.completed ? 'opacity-50' : ''}`}
                      >
                        <Checkbox 
                          id={task.id} 
                          checked={task.completed} 
                          onCheckedChange={() => toggleTask(task.id)}
                          className="w-6 h-6 border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label 
                              htmlFor={task.id} 
                              className={`font-bold text-lg cursor-pointer ${task.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-white'}`}
                            >
                              {task.description}
                            </label>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold px-1.5 py-0">
                                {task.time}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {getCategoryIcon(task.category)}
                                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-600">{task.category}</span>
                              </div>
                            </div>
                          </div>
                          {task.completed && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-8">
              <CardHeader className="bg-blue-600/5 dark:bg-blue-600/10 border-b border-blue-500/10 dark:border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  <CardTitle className="text-lg font-bold text-blue-600 dark:text-blue-400">FEEDBACK DO MENTOR</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                  "{plan.aiFeedback}"
                </p>
                <div className="mt-8 space-y-4">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Dicas de Performance</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      Elimine distrações digitais durante os blocos de produtividade.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      Beba 500ml de água a cada tarefa concluída.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      Mantenha a postura. Corpo forte, mente forte.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
