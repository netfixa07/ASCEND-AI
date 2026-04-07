import React, { useState, useEffect } from 'react';
import { FinancialLog } from '../types';
import { collection, query, where, onSnapshot, addDoc, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useProfile } from '../contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Wallet, TrendingUp, TrendingDown, Plus, History, PieChart, DollarSign, CreditCard, Tag, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export default function FinanceTracker() {
  const { profile, updateProfile } = useProfile();
  const [logs, setLogs] = useState<FinancialLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLog, setNewLog] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    paymentMethod: 'Pix'
  });

  const categories = {
    income: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
    expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Outros']
  };

  const paymentMethods = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência'];

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'financialLogs'),
      where('uid', '==', profile.uid),
      orderBy('date', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialLog));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'financialLogs');
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleAddLog = async () => {
    if (!profile) return;
    if (!newLog.amount || !newLog.category) {
      toast.error("Preencha o valor e a categoria.");
      return;
    }

    try {
      const logDate = new Date(`${newLog.date}T${newLog.time}`);
      await addDoc(collection(db, 'financialLogs'), {
        uid: profile.uid,
        type: newLog.type,
        category: newLog.category,
        amount: parseFloat(newLog.amount),
        description: newLog.description,
        date: logDate.toISOString(),
        paymentMethod: newLog.paymentMethod
      });

      // Update profile balance
      const amount = parseFloat(newLog.amount);
      const currentBalance = profile.financialBalance || 0;
      const newBalance = newLog.type === 'income' ? currentBalance + amount : currentBalance - amount;
      
      await updateProfile({ financialBalance: newBalance });

      setShowAdd(false);
      setNewLog({
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        paymentMethod: 'Pix'
      });
      toast.success("Registro financeiro adicionado!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'financialLogs');
    }
  };

  const totalIncome = logs.filter(l => l.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = logs.filter(l => l.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white">
            <Wallet className="w-8 h-8 text-green-500" />
            FINANÇAS
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Controle seus recursos para maximizar sua liberdade.</p>
        </div>
        <Button 
          onClick={() => setShowAdd(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl px-6 py-6 shadow-lg shadow-green-600/20"
        >
          <Plus className="w-5 h-5 mr-2" /> NOVO REGISTRO
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Entradas</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">R$ {totalIncome.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Saídas</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">R$ {totalExpense.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-2xl">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saldo Atual</p>
              <p className="text-2xl font-black text-white">R$ {balance.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
              <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-xl font-bold">Adicionar Registro</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant={newLog.type === 'expense' ? 'default' : 'outline'}
                        onClick={() => setNewLog({ ...newLog, type: 'expense', category: '' })}
                        className="flex-1 h-12 rounded-xl"
                      >
                        Despesa
                      </Button>
                      <Button 
                        variant={newLog.type === 'income' ? 'default' : 'outline'}
                        onClick={() => setNewLog({ ...newLog, type: 'income', category: '' })}
                        className="flex-1 h-12 rounded-xl"
                      >
                        Receita
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={newLog.amount}
                      onChange={(e) => setNewLog({ ...newLog, amount: e.target.value })}
                      className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      value={newLog.category}
                      onChange={(e) => setNewLog({ ...newLog, category: e.target.value })}
                      className="w-full h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories[newLog.type].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <select
                      value={newLog.paymentMethod}
                      onChange={(e) => setNewLog({ ...newLog, paymentMethod: e.target.value })}
                      className="w-full h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input 
                      type="date"
                      value={newLog.date}
                      onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                      className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input 
                      type="time"
                      value={newLog.time}
                      onChange={(e) => setNewLog({ ...newLog, time: e.target.value })}
                      className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Descrição (Opcional)</Label>
                    <Input 
                      placeholder="Ex: Almoço com equipe"
                      value={newLog.description}
                      onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                      className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button>
                  <Button onClick={handleAddLog} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">SALVAR</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-400" />
              <CardTitle className="text-lg font-bold">Últimos Registros</CardTitle>
            </div>
            <PieChart className="w-5 h-5 text-zinc-400 cursor-pointer hover:text-blue-500 transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            {logs.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
                  <DollarSign className="w-8 h-8 text-zinc-300" />
                </div>
                <p className="text-zinc-500 font-medium">Nenhum registro encontrado.</p>
              </div>
            ) : (
              <Table className="min-w-[800px]">
                <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10">
                  <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                    <TableHead className="w-[100px] font-black text-[10px] uppercase tracking-widest text-zinc-400">Tipo</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Categoria</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Descrição</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Pagamento</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Data</TableHead>
                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-zinc-400">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="group border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <TableCell>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {log.type === 'income' ? <Plus className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3 text-zinc-400" />
                          {log.category}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-500 font-medium min-w-[200px]">
                        {log.description || 'Sem descrição'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <CreditCard className="w-3 h-3" />
                          <span className="text-xs">{log.paymentMethod || 'Pix'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <CalendarIcon className="w-3 h-3" />
                          <span className="text-xs">{format(new Date(log.date), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-black whitespace-nowrap ${log.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {log.type === 'income' ? '+' : '-'} R$ {log.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
