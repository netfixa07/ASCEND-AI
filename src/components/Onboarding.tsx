import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ArrowRight, Brain, Dumbbell, Target, Clock, ArrowLeft } from 'lucide-react';

export default function Onboarding({ user, onCancel, onComplete }: { user: User | null, onCancel?: () => void, onComplete?: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState({
    routine: '',
    habits: '',
    physicalLevel: '',
    goals: '',
    timeAvailable: ''
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('onboarding_data', JSON.stringify(data));
  }, [data]);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const finish = async () => {
    setIsSubmitting(true);
    // Simulate IA processing
    setTimeout(() => {
      if (onComplete) {
        onComplete(data);
      }
      localStorage.removeItem('onboarding_data');
      setIsSubmitting(false);
    }, 1500);
  };

  const steps = [
    {
      title: "Diagnóstico Inicial",
      description: "Como é sua rotina diária hoje?",
      icon: <Clock className="w-12 h-12 text-blue-500" />,
      field: "routine",
      placeholder: "Ex: Acordo às 8h, trabalho até as 18h, durmo às 23h..."
    },
    {
      title: "Hábitos e Vícios",
      description: "Quais são seus maiores hábitos ruins ou distrações?",
      icon: <Brain className="w-12 h-12 text-purple-500" />,
      field: "habits",
      placeholder: "Ex: Redes sociais, procrastinação, má alimentação..."
    },
    {
      title: "Capacidade Física",
      description: "Qual seu nível de atividade física atual?",
      icon: <Dumbbell className="w-12 h-12 text-red-500" />,
      field: "physicalLevel",
      placeholder: "Ex: Sedentário, iniciante, intermediário..."
    },
    {
      title: "Objetivo Final",
      description: "Onde você quer chegar em 6 meses?",
      icon: <Target className="w-12 h-12 text-green-500" />,
      field: "goals",
      placeholder: "Ex: Perder 10kg, dobrar produtividade, ter disciplina..."
    },
    {
      title: "Tempo Disponível",
      description: "Quanto tempo por dia você pode dedicar à sua evolução?",
      icon: <Clock className="w-12 h-12 text-yellow-500" />,
      field: "timeAvailable",
      placeholder: "Ex: 1 hora pela manhã, 30 min à noite..."
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-lg"
        >
          <Card className="bg-zinc-950 border-zinc-800 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center mb-2">
                {currentStep.icon}
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter text-white">
                {currentStep.title}
              </CardTitle>
              <CardDescription className="text-zinc-400 text-lg">
                {currentStep.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="input" className="text-zinc-500">Sua resposta</Label>
                <textarea
                  id="input"
                  className="w-full min-h-[120px] bg-zinc-900 border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                  placeholder={currentStep.placeholder}
                  value={(data as any)[currentStep.field]}
                  onChange={(e) => setData({ ...data, [currentStep.field]: e.target.value })}
                />
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4">
                  {step > 1 && (
                    <Button variant="ghost" size="icon" onClick={prevStep} className="text-zinc-500 hover:text-white">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  {step === 1 && onCancel && (
                    <Button variant="ghost" size="icon" onClick={onCancel} className="text-zinc-500">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <div className="flex gap-1">
                    {steps.map((_, i) => (
                      <div 
                        key={`step-${i}`} 
                        className={`h-1 w-8 rounded-full transition-all ${i + 1 <= step ? 'bg-blue-500' : 'bg-zinc-800'}`} 
                      />
                    ))}
                  </div>
                </div>
                
                {step < steps.length ? (
                  <Button 
                    onClick={nextStep} 
                    disabled={!(data as any)[currentStep.field]}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-xl"
                  >
                    PRÓXIMO <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                ) : (
                  <Button 
                    onClick={finish}
                    disabled={!(data as any)[currentStep.field] || isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-6 rounded-xl"
                  >
                    {isSubmitting ? 'MODELANDO PERFIL...' : 'ENTRAR E FINALIZAR'} <Zap className={`ml-2 w-5 h-5 fill-white ${isSubmitting ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
