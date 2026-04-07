import React, { useState, useEffect } from 'react';
import { EmotionalLog } from '../types';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useProfile } from '../contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Heart, Brain, Sparkles, Wind, Moon, Sun, Smile, Frown, Meh, Zap, AlertCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EMOTIONS = [
  { id: 'happy', label: 'Feliz', icon: Smile, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'balanced', label: 'Equilibrado', icon: Meh, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'stressed', label: 'Estressado', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'anxious', label: 'Ansioso', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'tired', label: 'Cansado', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'sad', label: 'Triste', icon: Frown, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
];

const SUGGESTIONS: Record<string, { title: string, action: string, icon: any }> = {
  happy: { title: 'Mantenha o Flow', action: 'Aproveite esse estado para realizar tarefas complexas ou criativas.', icon: Sparkles },
  balanced: { title: 'Estabilidade é Poder', action: 'Ótimo momento para planejamento estratégico e decisões importantes.', icon: Brain },
  stressed: { title: 'Pausa Estratégica', action: 'Faça 5 minutos de respiração quadrada (4-4-4-4). O mundo pode esperar.', icon: Wind },
  anxious: { title: 'Ancoragem', action: 'Identifique 5 coisas que você vê agora. Foque no presente, não no futuro.', icon: Heart },
  tired: { title: 'Recuperação Ativa', action: 'Uma caminhada de 10 minutos ou um cochilo de 20 minutos farão milagres.', icon: Moon },
  sad: { title: 'Auto-Compaixão', action: 'Escreva 3 coisas pelas quais você é grato hoje, por menores que sejam.', icon: Sun },
};

interface EmotionalSupportProps {
  onTalkToMentor?: (message: string) => void;
}

export default function EmotionalSupport({ onTalkToMentor }: EmotionalSupportProps) {
  const { profile, updateProfile, updateScores } = useProfile();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [history, setHistory] = useState<EmotionalLog[]>([]);
  const [loading, setLoading] = useState(true);

  const handleTalkToMentor = () => {
    if (!onTalkToMentor || !selectedEmotion) return;
    const emotionLabel = EMOTIONS.find(e => e.id === selectedEmotion)?.label || selectedEmotion;
    const message = `Olá Mentor, gostaria de conversar. Atualmente estou me sentindo ${emotionLabel.toLowerCase()} com uma intensidade de ${intensity}/10. Pode me ajudar a lidar com isso e manter minha alta performance?`;
    onTalkToMentor(message);
  };

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'emotionalLogs'),
      where('uid', '==', profile.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmotionalLog));
      setHistory(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'emotionalLogs');
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleCheckIn = async () => {
    if (!profile || !selectedEmotion) return;

    try {
      const timestamp = new Date().toISOString();
      await addDoc(collection(db, 'emotionalLogs'), {
        uid: profile.uid,
        state: selectedEmotion,
        intensity,
        timestamp
      });

      await updateProfile({
        lastEmotionalCheckIn: {
          state: selectedEmotion,
          intensity,
          timestamp
        }
      });

      // Update mental level based on emotion
      let amount = 0;
      if (['happy', 'balanced'].includes(selectedEmotion)) {
        amount = 2;
      } else if (['stressed', 'anxious', 'tired', 'sad'].includes(selectedEmotion)) {
        amount = -1;
      }
      
      if (amount !== 0) {
        await updateScores('mental', amount);
      }

      toast.success("Check-in emocional realizado!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'emotionalLogs');
    }
  };

  const currentSuggestion = selectedEmotion ? SUGGESTIONS[selectedEmotion] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="space-y-2">
        <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4 text-zinc-900 dark:text-white">
          <Heart className="w-10 h-10 text-red-500" />
          SUPORTE EMOCIONAL
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xl">Sua mente é seu maior ativo. Cuide dela com inteligência.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-10 pb-0">
            <CardTitle className="text-2xl font-black tracking-tight">Como você se sente agora?</CardTitle>
            <CardDescription>Seja honesto consigo mesmo. A IA usará isso para te guiar.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="grid grid-cols-3 gap-4">
              {EMOTIONS.map((emotion) => {
                const Icon = emotion.icon;
                const isSelected = selectedEmotion === emotion.id;
                return (
                  <button
                    key={emotion.id}
                    onClick={() => setSelectedEmotion(emotion.id)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-all duration-300 border-2 ${
                      isSelected 
                        ? `${emotion.bg} border-zinc-900 dark:border-white scale-105 shadow-xl` 
                        : 'bg-zinc-50 dark:bg-zinc-900 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'
                    }`}
                  >
                    <Icon className={`w-8 h-8 ${emotion.color}`} />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">{emotion.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-black uppercase tracking-widest text-zinc-400">Intensidade</Label>
                <span className="text-xl font-black text-zinc-900 dark:text-white">{intensity}/10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
              />
            </div>

            <Button 
              onClick={handleCheckIn}
              disabled={!selectedEmotion}
              className="w-full h-16 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-lg hover:scale-[1.02] transition-transform shadow-2xl"
            >
              REGISTRAR ESTADO
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {currentSuggestion ? (
              <motion.div
                key={selectedEmotion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-zinc-900 border-zinc-800 shadow-2xl rounded-3xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-24 h-24 text-white" />
                  </div>
                  <CardContent className="p-10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                        <currentSuggestion.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight">{currentSuggestion.title}</h3>
                    </div>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      {currentSuggestion.action}
                    </p>
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleTalkToMentor}
                        className="border-white/10 text-white hover:bg-white/10 rounded-xl font-bold"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" /> Conversar com Mentor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-dashed border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl h-[300px] flex items-center justify-center text-center p-10">
                <div className="space-y-4">
                  <Sparkles className="w-12 h-12 text-zinc-300 mx-auto" />
                  <p className="text-zinc-500 font-medium">Selecione como você se sente para receber uma orientação personalizada.</p>
                </div>
              </Card>
            )}
          </AnimatePresence>

          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-lg font-black tracking-tight">Histórico Recente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {history.map((log) => {
                  const emotion = EMOTIONS.find(e => e.id === log.state);
                  const Icon = emotion?.icon || Meh;
                  return (
                    <div key={log.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${emotion?.bg}`}>
                          <Icon className={`w-4 h-4 ${emotion?.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{emotion?.label}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">{format(new Date(log.timestamp), 'dd/MM HH:mm')}</p>
                        </div>
                      </div>
                      <div className="text-xs font-black text-zinc-400">Intensidade: {log.intensity}/10</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
