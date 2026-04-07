import React, { useState, useEffect, useRef } from 'react';
import { FocusSession } from '../types';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useProfile } from '../contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Zap, Play, Pause, RotateCcw, Timer, Brain, Target, CheckCircle2, Coffee, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function FocusMode() {
  const { profile, updateScores } = useProfile();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [task, setTask] = useState('');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (mode === 'work') {
      toast.success("Sessão de foco concluída! Hora de um descanso.");
      setSessionsCompleted(prev => prev + 1);
      
      if (profile) {
        try {
          await addDoc(collection(db, 'focusSessions'), {
            uid: profile.uid,
            startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            endTime: new Date().toISOString(),
            duration: 25,
            task: task || 'Foco Geral',
            completed: true
          });

          // Update productivity score
          await updateScores('productivity', 5);
          
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'focusSessions');
        }
      }

      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      toast.info("Descanso finalizado. Vamos voltar ao trabalho?");
      setMode('work');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => {
    if (!task && mode === 'work') {
      toast.error("Defina uma tarefa antes de começar o foco.");
      return;
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((mode === 'work' ? 25 * 60 : 5 * 60) - timeLeft) / (mode === 'work' ? 25 * 60 : 5 * 60) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4 text-zinc-900 dark:text-white">
            <Brain className="w-10 h-10 text-blue-500" />
            MODO FOCO
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xl">Elimine distrações e entre em estado de flow absoluto.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/50 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Sessões Hoje</span>
            <span className="text-3xl font-black text-zinc-900 dark:text-white">{sessionsCompleted}</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Target className="w-7 h-7 text-blue-500 fill-blue-500" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden rounded-[2.5rem] relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-zinc-100 dark:bg-zinc-900">
            <motion.div 
              className={`h-full ${mode === 'work' ? 'bg-blue-600' : 'bg-green-500'}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
          <CardContent className="p-12 space-y-12 text-center">
            <div className="space-y-4">
              <Badge className={`px-4 py-1.5 font-black uppercase tracking-[0.2em] border-none ${mode === 'work' ? 'bg-blue-600/10 text-blue-600' : 'bg-green-500/10 text-green-500'}`}>
                {mode === 'work' ? 'Foco Total' : 'Descanso'}
              </Badge>
              <h2 className="text-8xl font-black tracking-tighter text-zinc-900 dark:text-white tabular-nums">
                {formatTime(timeLeft)}
              </h2>
            </div>

            <div className="flex items-center justify-center gap-6">
              <Button 
                onClick={toggleTimer}
                className={`w-24 h-24 rounded-full shadow-2xl transition-all hover:scale-110 ${isActive ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetTimer}
                className="w-16 h-16 rounded-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex justify-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => { setMode('work'); setTimeLeft(25 * 60); setIsActive(false); }}
                className={`rounded-xl font-bold ${mode === 'work' ? 'text-blue-600 bg-blue-600/5' : 'text-zinc-400'}`}
              >
                Pomodoro (25m)
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
                className={`rounded-xl font-bold ${mode === 'break' ? 'text-green-500 bg-green-500/5' : 'text-zinc-400'}`}
              >
                Descanso (5m)
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                MISSÃO ATUAL
              </CardTitle>
              <CardDescription>O que você vai conquistar nesta sessão?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tarefa de Foco</Label>
                <Input 
                  placeholder="Ex: Escrever relatório de vendas..."
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  disabled={isActive}
                  className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold text-lg"
                />
              </div>
              <div className="p-6 bg-blue-600/5 dark:bg-blue-600/10 rounded-2xl border border-blue-600/10 space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-500">Dica de Performance IA</p>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  "Divida essa tarefa em sub-etapas de 10 minutos. O cérebro libera dopamina a cada pequena vitória, mantendo você no flow por mais tempo."
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Técnica</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Anti-Procrastinação</p>
            </div>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Intervalo</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Recuperação Ativa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
