import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useProfile } from '../contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Target, Plus, CheckCircle2, Circle, Trash2, Calendar, TrendingUp, Trophy, Sparkles, ChevronRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GoalPlanner() {
  const { profile, updateScores } = useProfile();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'late'>('pending');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    category: 'personal' as Goal['category']
  });

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'goals'),
      where('uid', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      setGoals(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'goals');
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleAddGoal = async () => {
    if (!profile || !newGoal.title || !newGoal.targetDate) {
      toast.error("Preencha o título e a data alvo.");
      return;
    }

    try {
      await addDoc(collection(db, 'goals'), {
        uid: profile.uid,
        title: newGoal.title,
        description: newGoal.description,
        targetDate: newGoal.targetDate,
        category: newGoal.category,
        status: 'active',
        steps: [],
        progress: 0
      });
      setShowAdd(false);
      setNewGoal({ title: '', description: '', targetDate: '', category: 'personal' });
      toast.success("Meta definida com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'goals');
    }
  };

  const handleToggleStep = async (goalId: string, stepId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const step = goal.steps.find(s => s.id === stepId);
    if (!step) return;

    const isCompleting = !step.completed;
    const newSteps = goal.steps.map(s => s.id === stepId ? { ...s, completed: isCompleting } : s);
    const completedCount = newSteps.filter(s => s.completed).length;
    const progress = newSteps.length > 0 ? Math.round((completedCount / newSteps.length) * 100) : 0;

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        steps: newSteps,
        progress,
        status: progress === 100 ? 'completed' : 'active'
      });

      // Update productivity score for step completion
      await updateScores('productivity', isCompleting ? 2 : -2);
      
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'goals');
    }
  };

  const [newStepTitles, setNewStepTitles] = useState<Record<string, string>>({});

  const handleAddStep = async (goalId: string) => {
    const stepTitle = newStepTitles[goalId];
    if (!stepTitle) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newStep = { id: Math.random().toString(36).substr(2, 9), title: stepTitle, completed: false };
    const newSteps = [...goal.steps, newStep];
    const progress = Math.round((newSteps.filter(s => s.completed).length / newSteps.length) * 100);

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        steps: newSteps,
        progress
      });
      setNewStepTitles(prev => ({ ...prev, [goalId]: '' }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'goals');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteDoc(doc(db, 'goals', goalId));
      toast.success("Meta removida.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'goals');
    }
  };

  const handleToggleGoalStatus = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const isCompleting = goal.status !== 'completed';
    const newStatus = isCompleting ? 'completed' : 'active';
    const newProgress = isCompleting ? 100 : goal.progress;

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        status: newStatus,
        progress: newProgress
      });

      // Update productivity score for goal completion
      await updateScores('productivity', isCompleting ? 15 : -15);
      
      toast.success(newStatus === 'completed' ? "Meta concluída! Parabéns!" : "Meta reativada.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'goals');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4 text-zinc-900 dark:text-white">
            <Trophy className="w-10 h-10 text-yellow-500" />
            OBJETIVOS
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xl">Transforme seus sonhos em planos estratégicos e conquiste o impossível.</p>
        </div>
        <Button 
          onClick={() => setShowAdd(true)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl px-8 py-7 shadow-2xl hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5 mr-2" /> CRIAR PLANO
        </Button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 p-8 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-2xl font-black tracking-tight">Definir Novo Objetivo</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Título da Meta</Label>
                    <Input 
                      placeholder="Ex: Comprar meu primeiro imóvel"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      className="h-14 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data para término da meta</Label>
                    <Input 
                      type="date" 
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                      className="h-14 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Categoria</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['personal', 'professional', 'financial', 'health'].map((cat) => (
                        <Button
                          key={cat}
                          variant={newGoal.category === cat ? 'default' : 'outline'}
                          onClick={() => setNewGoal({ ...newGoal, category: cat as Goal['category'] })}
                          className="capitalize rounded-xl font-bold"
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Descrição / Porquê</Label>
                    <Input 
                      placeholder="Qual o seu propósito com esta meta?"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      className="h-14 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setShowAdd(false)} className="rounded-xl font-bold">Cancelar</Button>
                  <Button onClick={handleAddGoal} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-12 rounded-xl h-14">CRIAR PLANO</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-4">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          className="rounded-xl font-bold px-6"
        >
          Metas pendentes
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          className="rounded-xl font-bold px-6"
        >
          Metas concluídas
        </Button>
        <Button
          variant={filter === 'late' ? 'default' : 'outline'}
          onClick={() => setFilter('late')}
          className={`rounded-xl font-bold px-6 ${filter === 'late' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-red-500 border-red-500/20 hover:bg-red-500/10'}`}
        >
          Metas atrasadas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {goals.filter(goal => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const targetDate = new Date(goal.targetDate);
          targetDate.setHours(0, 0, 0, 0);
          
          const isCompleted = goal.status === 'completed';
          const isLate = !isCompleted && targetDate < today;
          const isPending = !isCompleted && targetDate >= today;

          if (filter === 'completed') return isCompleted;
          if (filter === 'late') return isLate;
          if (filter === 'pending') return isPending;
          return true;
        }).map((goal) => (
          <motion.div
            key={goal.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-blue-500/10 text-blue-500 border-none px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                    {goal.category}
                  </Badge>
                  <button onClick={() => handleDeleteGoal(goal.id!)} className="text-zinc-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <CardTitle className="text-xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                  {goal.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-zinc-400 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold">{format(new Date(goal.targetDate), 'dd/MM/yyyy')}</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Progresso</span>
                    <span className="text-lg font-black text-zinc-900 dark:text-white">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Etapas do Plano</p>
                  <div className="space-y-2">
                    {goal.steps.map((step) => (
                      <button
                        key={step.id}
                        onClick={() => handleToggleStep(goal.id!, step.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
                      >
                        {step.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-300 shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${step.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {step.title}
                        </span>
                      </button>
                    ))}
                    <div className="pt-2">
                      <Input 
                        placeholder="+ Adicionar etapa..."
                        className="h-10 rounded-xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-transparent text-xs font-bold"
                        value={newStepTitles[goal.id!] || ''}
                        onChange={(e) => setNewStepTitles(prev => ({ ...prev, [goal.id!]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddStep(goal.id!);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900">
                  <Button
                    onClick={() => handleToggleGoalStatus(goal.id!)}
                    variant={goal.status === 'completed' ? 'default' : 'outline'}
                    className={`w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                      goal.status === 'completed' 
                        ? 'bg-green-600 hover:bg-green-700 text-white border-none' 
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {goal.status === 'completed' ? (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> META CONCLUÍDA</>
                    ) : (
                      'CONCLUIR META'
                    )}
                  </Button>
                </div>

                <div className="pt-4 flex items-center gap-2 text-blue-600 dark:text-blue-500">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Mentor Sugere: </span>
                  <span className="text-[10px] font-bold">Foque na próxima etapa.</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

