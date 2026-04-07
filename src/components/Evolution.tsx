import React, { useState, useEffect } from 'react';
import { EvolutionLog, Goal, FinancialLog } from '../types';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { TrendingUp, TrendingDown, Brain, Dumbbell, Zap, Calendar, Star, Target, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'motion/react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from '../contexts/ProfileContext';

export default function Evolution() {
  const { profile } = useProfile();
  const [logs, setLogs] = useState<EvolutionLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [financeLogs, setFinanceLogs] = useState<FinancialLog[]>([]);

  useEffect(() => {
    if (!profile) return;
    
    // Evolution Logs
    const qEvo = query(
      collection(db, 'evolution'),
      where('uid', '==', profile.uid),
      orderBy('date', 'asc'),
      limit(30)
    );
    const unsubEvo = onSnapshot(qEvo, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as EvolutionLog));
      if (data.length === 0) {
        const mockData = Array.from({ length: 7 }).map((_, i) => ({
          id: `mock-${i}`,
          uid: profile.uid,
          date: format(subDays(new Date(), 6 - i), 'dd/MM'),
          mentalScore: 20 + i * 10 + Math.random() * 5,
          physicalScore: 15 + i * 8 + Math.random() * 5,
          productivityScore: 30 + i * 12 + Math.random() * 5
        }));
        setLogs(mockData as any);
      } else {
        setLogs(data);
      }
    });

    // Goals
    const qGoals = query(collection(db, 'goals'), where('uid', '==', profile.uid));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      setGoals(snapshot.docs.map(doc => doc.data() as Goal));
    });

    // Finance
    const qFinance = query(collection(db, 'financialLogs'), where('uid', '==', profile.uid));
    const unsubFinance = onSnapshot(qFinance, (snapshot) => {
      setFinanceLogs(snapshot.docs.map(doc => doc.data() as FinancialLog));
    });

    return () => {
      unsubEvo();
      unsubGoals();
      unsubFinance();
    };
  }, [profile?.uid]);

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalIncome = financeLogs.filter(l => l.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = financeLogs.filter(l => l.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl">
          <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">{label}</p>
          {payload.map((entry: any, i: number) => (
            <div key={`tooltip-${entry.dataKey}-${i}`} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-zinc-400">{entry.name}:</span>
              <span className="font-bold text-white">{Math.round(entry.value)}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            EVOLUÇÃO
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">Análise de dados da sua jornada de ascensão.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-bold text-zinc-900 dark:text-white">Nível {Math.floor((profile.mentalLevel || 1) / 10) + 1}</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />
            <span className="text-sm font-bold text-zinc-900 dark:text-white">Top 5% Global</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Progresso Multidimensional</CardTitle>
              </div>
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Mental</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Físico</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Produtividade</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={logs}>
                <defs>
                  <linearGradient id="colorMental" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPhysical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} className="dark:stroke-zinc-800" />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="mentalScore" 
                  name="Mental" 
                  stroke="#a855f7" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorMental)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="physicalScore" 
                  name="Físico" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPhysical)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="productivityScore" 
                  name="Produtividade" 
                  stroke="#22c55e" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorProd)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Metas & Conquistas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Metas Ativas</span>
                <span className="font-bold text-zinc-900 dark:text-white">{goals.filter(g => g.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Metas Concluídas</span>
                <span className="font-bold text-green-600">{completedGoals}</span>
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Taxa de Sucesso</span>
                  <span className="text-sm font-black text-blue-600">{goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600" 
                    style={{ width: `${goals.length > 0 ? (completedGoals / goals.length) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-500" />
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Saúde Financeira</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Saldo Total</span>
                <span className={`font-black ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {balance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Economia Mensal</span>
                <span className="font-bold text-blue-600">
                  {totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 border-none shadow-xl shadow-blue-600/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h4 className="font-black text-white text-lg leading-tight">ASCENSÃO ELITE</h4>
                <p className="text-blue-100 text-xs">Você está acima de 95% dos usuários em disciplina mental.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
