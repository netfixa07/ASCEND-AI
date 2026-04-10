import React, { useState, useEffect, useRef } from 'react';
import { PsychologistSession } from '../types';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useProfile } from '../contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Heart, Send, Loader2, Lock, Sparkles, Brain, Shield, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getPsychologistResponse } from '../services/gemini';
import { Badge } from './ui/badge';

export default function PsychologistIA() {
  const { profile, updateProfile } = useProfile();
  const [session, setSession] = useState<PsychologistSession | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'psychologistSessions'),
      where('uid', '==', profile.uid),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setSession({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as PsychologistSession);
      } else {
        setSession(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'psychologistSessions');
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [session?.messages]);

  const startSession = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const newSession: PsychologistSession = {
        uid: profile.uid,
        status: 'active',
        messages: [
          { 
            role: 'model', 
            content: `Olá ${profile.displayName || 'amigo(a)'}. Eu sou a Dra. Elena. Estou aqui para te ouvir de forma acolhedora e sem julgamentos. Como você está se sentindo hoje?`, 
            timestamp: new Date().toISOString() 
          }
        ],
        emotionalPatterns: [],
        lastUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'psychologistSessions'), newSession);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'psychologistSessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !profile || !session || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const updatedMessages = [
      ...session.messages,
      { role: 'user' as const, content: userMessage, timestamp: new Date().toISOString() }
    ];

    try {
      // Optimistic update
      setSession({ ...session, messages: updatedMessages });

      const history = session.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const aiResponse = await getPsychologistResponse(userMessage, history, profile);

      const finalMessages = [
        ...updatedMessages,
        { role: 'model' as const, content: aiResponse, timestamp: new Date().toISOString() }
      ];

      await updateDoc(doc(db, 'psychologistSessions', session.id!), {
        messages: finalMessages,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      toast.error("Erro ao enviar mensagem.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white uppercase">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            Dra. Elena
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Sua Psicóloga IA Humanizada</p>
        </div>
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-black px-3 py-1">SESSÃO PREMIUM</Badge>
      </header>

      {!session ? (
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[2.5rem] overflow-hidden text-center">
            <CardContent className="p-10 space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Pronto para começar?</h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Uma sessão de terapia pode te ajudar a clarear a mente e focar no que realmente importa.
                </p>
              </div>
              <Button 
                onClick={startSession}
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "INICIAR SESSÃO"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sessão em andamento</span>
          </div>

          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-6">
              {session.messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="flex gap-3">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Como você está se sentindo?"
                className="flex-1 h-14 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl px-6"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="h-14 w-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              <Info className="w-3 h-3" />
              Esta IA não substitui ajuda profissional real.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
