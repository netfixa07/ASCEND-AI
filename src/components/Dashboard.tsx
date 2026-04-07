import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Zap, TrendingUp, Brain, Dumbbell, Clock, Flame, Target, Star, Wallet, Heart, Sparkles, CheckCircle2, CreditCard, Plus, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useProfile } from '../contexts/ProfileContext';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FinancialLog, Goal } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "./ui/table";

export default function Dashboard() {
  const { profile } = useProfile();
  const [recentFinance, setRecentFinance] = useState<FinancialLog[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  
  useEffect(() => {
    if (!profile) return;
    
    // Finance
    const qFinance = query(
      collection(db, 'financialLogs'),
      where('uid', '==', profile.uid),
      orderBy('date', 'desc'),
      limit(5)
    );
    const unsubFinance = onSnapshot(qFinance, (snapshot) => {
      setRecentFinance(snapshot.docs.map(doc => doc.data() as FinancialLog));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'financialLogs');
    });

    // Goals
    const qGoals = query(
      collection(db, 'goals'),
      where('uid', '==', profile.uid),
      where('status', '==', 'active'),
      limit(3)
    );
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      setActiveGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'goals');
    });

    return () => {
      unsubFinance();
      unsubGoals();
    };
  }, [profile?.uid]);

  if (!profile) return null;

  const totalIncome = recentFinance.filter(l => l.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = recentFinance.filter(l => l.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const stats = [
    { label: 'Nível Mental', value: profile.mentalLevel || 1, max: 100, icon: <Brain className="w-5 h-5 text-purple-500" /> },
    { label: 'Nível Físico', value: profile.physicalScore || 10, max: 100, icon: <Dumbbell className="w-5 h-5 text-red-500" /> },
    { label: 'Produtividade', value: profile.productivityScore || 45, max: 100, icon: <TrendingUp className="w-5 h-5 text-green-500" /> },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">BEM-VINDO, {profile.displayName?.toUpperCase()}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg">Seu progresso de ascensão hoje.</p>
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-row items-center gap-3 md:gap-4 bg-white dark:bg-zinc-900/50 p-3 md:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 px-1 md:px-2">
            <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Plano Ativo</span>
              <span className="text-xs md:text-sm font-black text-zinc-900 dark:text-white uppercase truncate max-w-[80px] md:max-w-none">{profile.currentPlan || 'NENHUM'}</span>
            </div>
          </div>
          <div className="hidden md:block w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Flame className="w-5 h-5 md:w-6 md:h-6 text-orange-500 fill-orange-500" />
            <span className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">{profile.streak} DIAS</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2 justify-center md:justify-start col-span-2 md:col-span-1 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
            <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 fill-yellow-500" />
            <span className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase">NÍVEL {Math.floor((profile.mentalLevel || 1) / 10) + 1}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-black text-zinc-900 dark:text-white">{stat.value}%</div>
                <Progress value={stat.value} className="h-2 bg-zinc-100 dark:bg-zinc-900" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Metas Ativas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {activeGoals.length > 0 ? (
                activeGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{goal.title}</span>
                      <span className="text-xs font-black text-blue-600">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-1.5 bg-zinc-100 dark:bg-zinc-900" />
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-zinc-500 text-sm">Nenhuma meta ativa no momento.</p>
                </div>
              )}
              <div className="mt-6 p-4 bg-blue-600/5 rounded-xl border border-blue-500/10 dark:border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-1">DICA DO MENTOR:</p>
                <p className="text-zinc-600 dark:text-zinc-400">Foque na consistência, não na intensidade inicial. O hábito é o que constrói o império.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Estado Emocional</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {profile.lastEmotionalCheckIn ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl">
                      <Sparkles className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-zinc-900 dark:text-white capitalize">{profile.lastEmotionalCheckIn.state}</p>
                      <p className="text-xs text-zinc-500">Intensidade: {profile.lastEmotionalCheckIn.intensity}/10</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-600/10 text-blue-600 border-none">ATUALIZADO</Badge>
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-4">Nenhum check-in emocional hoje.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-500" />
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Resumo Financeiro</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Saldo Consolidado</span>
                <span className={`font-black text-lg ${ (profile.financialBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {(profile.financialBalance || 0).toFixed(2)}
                </span>
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Últimas Movimentações</p>
                <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                  <Table className="min-w-[300px]">
                    <TableBody>
                      {recentFinance.length === 0 ? (
                        <TableRow>
                          <TableCell className="text-center py-4 text-xs text-zinc-500">Sem movimentações.</TableCell>
                        </TableRow>
                      ) : (
                        recentFinance.map((log, idx) => (
                          <TableRow key={idx} className="border-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <TableCell className="p-2">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${log.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {log.type === 'income' ? <Plus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              </div>
                            </TableCell>
                            <TableCell className="p-2">
                              <span className="text-xs font-bold text-zinc-900 dark:text-white whitespace-nowrap">{log.category}</span>
                            </TableCell>
                            <TableCell className="p-2 text-right">
                              <span className={`text-xs font-black whitespace-nowrap ${log.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {log.type === 'income' ? '+' : '-'} R$ {log.amount.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Status de Hoje</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">Tempo em Foco</p>
                    <p className="text-xs text-zinc-500">Meta: 4h hoje</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 text-zinc-500">2h 15m</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">Treino Físico</p>
                    <p className="text-xs text-zinc-500">Meta: 45m hoje</p>
                  </div>
                </div>
                <Badge className="bg-green-600/10 dark:bg-green-600/20 text-green-600 dark:text-green-500 hover:bg-green-600/20 dark:hover:bg-green-600/30 border-none">CONCLUÍDO</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
