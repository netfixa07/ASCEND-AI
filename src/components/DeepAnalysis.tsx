import React, { useState } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { analyzeRootCause } from '../services/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Brain, Search, AlertTriangle, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function DeepAnalysis() {
  const { profile, updateProfile } = useProfile();
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (!problem.trim()) return;
    setLoading(true);
    try {
      const analysis = await analyzeRootCause(profile, problem, history);
      setResult(analysis);
      
      // Update history for Gemini
      setHistory(prev => [...prev, 
        { role: 'user', parts: [{ text: problem }] },
        { role: 'model', parts: [{ text: analysis.analysis }] }
      ]);

      // Save to profile history for pattern tracking
      if (profile) {
        const newHistory = [
          ...(profile.deepAnalysisHistory || []),
          {
            problem: problem,
            rootCause: analysis.rootCause,
            date: new Date().toISOString()
          }
        ].slice(-10); // Keep last 10 for analysis
        
        await updateProfile({ deepAnalysisHistory: newHistory });
      }

      setProblem('');
    } catch (error) {
      toast.error("Erro ao processar análise profunda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-2xl">
            <Brain className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
              Raiz do Problema
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Análise profunda para identificar padrões de autossabotagem e causas reais.
            </p>
          </div>
        </div>
      </header>

      {!result ? (
        <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-12 space-y-8">
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                O que está te travando hoje?
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                Descreva um problema, comportamento repetitivo ou dificuldade que você quer entender a fundo.
              </p>
            </div>

            <div className="relative group">
              <Input
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Ex: Eu sempre procrastino quando o projeto é importante..."
                className="h-20 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-8 text-lg font-bold focus:ring-purple-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <Button 
                onClick={handleAnalyze}
                disabled={loading || !problem.trim()}
                className="absolute right-3 top-3 h-14 px-8 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black shadow-xl transition-all hover:scale-105"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6 mr-2" />}
                ANALISAR
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-zinc-900 border-purple-500/30 shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-12 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-400 font-black uppercase tracking-widest text-xs">
                    <Sparkles className="w-4 h-4" />
                    Análise Estratégica
                  </div>
                  <p className="text-2xl font-bold text-white leading-relaxed">
                    {result.analysis}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-zinc-800/50 rounded-3xl border border-zinc-700/50 space-y-4">
                    <div className="flex items-center gap-2 text-red-400 font-black uppercase tracking-widest text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      Causa Raiz
                    </div>
                    <p className="text-xl font-black text-white uppercase tracking-tight">
                      {result.rootCause}
                    </p>
                  </div>

                  <div className="p-8 bg-zinc-800/50 rounded-3xl border border-zinc-700/50 space-y-4">
                    <div className="flex items-center gap-2 text-blue-400 font-black uppercase tracking-widest text-xs">
                      <Search className="w-4 h-4" />
                      Padrões Detectados
                    </div>
                    <ul className="space-y-2">
                      {result.patterns.map((p: string, i: number) => (
                        <li key={i} className="text-zinc-300 font-bold flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-8 bg-purple-600 rounded-3xl shadow-xl space-y-4">
                  <div className="text-white/70 font-black uppercase tracking-widest text-xs">
                    Ação Prática Imediata
                  </div>
                  <p className="text-2xl font-black text-white uppercase tracking-tight">
                    {result.immediateAction}
                  </p>
                </div>

                <div className="pt-8 border-t border-zinc-800 space-y-6">
                  <p className="text-zinc-400 font-bold italic text-center">
                    "{result.nextQuestion}"
                  </p>
                  <div className="flex gap-4">
                    <Input
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="Responda para aprofundar..."
                      className="h-16 rounded-2xl border-zinc-800 bg-zinc-800/50 text-white font-bold"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                    <Button 
                      onClick={handleAnalyze}
                      disabled={loading || !problem.trim()}
                      className="h-16 px-8 bg-white text-zinc-900 hover:bg-zinc-200 rounded-2xl font-black"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setResult(null)}
                    className="w-full text-zinc-500 hover:text-white font-bold"
                  >
                    Nova Análise
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
