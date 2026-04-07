import React, { useState, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { simulateFuture } from '../services/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Timer, TrendingUp, TrendingDown, AlertCircle, Sparkles, Loader2, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function FutureSimulator() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const data = await simulateFuture(profile);
      setSimulation(data);
    } catch (error) {
      toast.error("Erro ao simular futuro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Timer className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
              Simulador de Futuro
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xl font-medium max-w-2xl">
            Projete sua vida com base nas suas escolhas de hoje. Onde você estará em 1, 5 e 10 anos?
          </p>
        </div>
        <Button 
          onClick={handleSimulate}
          disabled={loading}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl px-12 py-8 shadow-2xl hover:scale-105 transition-all text-lg"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 mr-3" />}
          SIMULAR AGORA
        </Button>
      </header>

      {!simulation ? (
        <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[3rem] overflow-hidden">
          <CardContent className="p-20 text-center space-y-8">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-12 h-12 text-zinc-400" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                Pronto para ver o amanhã?
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md mx-auto">
                A IA analisará seus hábitos, consistência e objetivos para projetar dois caminhos possíveis.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Cenário Negativo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3 text-red-500 font-black uppercase tracking-widest text-sm">
              <TrendingDown className="w-6 h-6" />
              Cenário: Inércia e Inconsistência
            </div>
            
            <div className="space-y-6">
              {[
                { time: '1 Ano', text: simulation?.negative?.['1year'] || '', icon: '📅' },
                { time: '5 Anos', text: simulation?.negative?.['5years'] || '', icon: '⏳' },
                { time: '10 Anos', text: simulation?.negative?.['10years'] || '', icon: '💀' },
              ].map((item, i) => (
                <Card key={i} className="bg-red-500/5 border-red-500/10 rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8 flex gap-6">
                    <div className="text-4xl">{item.icon}</div>
                    <div className="space-y-2">
                      <div className="text-red-500 font-black uppercase tracking-widest text-[10px]">{item.time}</div>
                      <p className="text-zinc-700 dark:text-zinc-300 font-bold leading-relaxed">{item.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Cenário Positivo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3 text-green-500 font-black uppercase tracking-widest text-sm">
              <TrendingUp className="w-6 h-6" />
              Cenário: Disciplina e Ascensão
            </div>
            
            <div className="space-y-6">
              {[
                { time: '1 Ano', text: simulation?.positive?.['1year'] || '', icon: '🚀' },
                { time: '5 Anos', text: simulation?.positive?.['5years'] || '', icon: '🏆' },
                { time: '10 Anos', text: simulation?.positive?.['10years'] || '', icon: '👑' },
              ].map((item, i) => (
                <Card key={i} className="bg-green-500/5 border-green-500/10 rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8 flex gap-6">
                    <div className="text-4xl">{item.icon}</div>
                    <div className="space-y-2">
                      <div className="text-green-500 font-black uppercase tracking-widest text-[10px]">{item.time}</div>
                      <p className="text-zinc-700 dark:text-zinc-300 font-bold leading-relaxed">{item.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Alerta de Impacto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card className="bg-zinc-900 border-yellow-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardContent className="p-12 flex flex-col md:flex-row items-center gap-10">
                <div className="p-6 bg-yellow-500/10 rounded-3xl">
                  <AlertCircle className="w-12 h-12 text-yellow-500" />
                </div>
                <div className="space-y-4 flex-1">
                  <div className="text-yellow-500 font-black uppercase tracking-widest text-xs">Aviso do Mentor</div>
                  <p className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                    {simulation.warning}
                  </p>
                </div>
                <Button 
                  onClick={() => setSimulation(null)}
                  variant="outline"
                  className="rounded-2xl border-zinc-700 text-zinc-400 hover:text-white font-black px-8 h-16"
                >
                  Nova Simulação
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
