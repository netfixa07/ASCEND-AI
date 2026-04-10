import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getMentorResponse } from '../services/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Zap, Send, Brain, MessageSquare, Loader2, User, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '../contexts/ProfileContext';
import { Logo } from './Logo';

interface MentorChatProps {
  initialMessage?: string | null;
  onMessageConsumed?: () => void;
}

export default function MentorChat({ initialMessage, onMessageConsumed }: MentorChatProps) {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
      if (onMessageConsumed) onMessageConsumed();
    }
  }, [initialMessage]);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'chats'),
      where('uid', '==', profile.uid),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as ChatMessage));
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });
    return () => unsubscribe();
  }, [profile?.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !profile) return;
    
    const userMsg = input;
    setInput('');
    setLoading(true);

    try {
      // Add user message to Firestore
      await addDoc(collection(db, 'chats'), {
        uid: profile.uid,
        role: 'user',
        content: userMsg,
        timestamp: new Date().toISOString()
      });

      // Get history for context (excluding the message we just added if it's already in the state)
      const history = messages
        .filter(m => m.content !== userMsg || (m.timestamp && new Date(m.timestamp).getTime() < Date.now() - 1000))
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

      // Get AI response
      const aiResponse = await getMentorResponse(userMsg, history, profile);

      // Add AI response to Firestore
      await addDoc(collection(db, 'chats'), {
        uid: profile.uid,
        role: 'model',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro no chat:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            MENTOR IA
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">Diálogo direto com a ASCEND AI.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-600/5 dark:bg-blue-600/10 px-4 py-2 rounded-full border border-blue-500/10 dark:border-blue-500/20">
          <Logo showText={false} size="sm" />
          <span className="text-xs font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest">Modo Elite Ativo</span>
        </div>
      </header>

      <Card className="flex-1 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden min-h-[500px] shadow-sm">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                  <Brain className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Inicie sua Mentoria</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-xs">Tire dúvidas, peça ajustes no plano ou relate suas dificuldades.</p>
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <motion.div
                key={msg.id || `${msg.role}-${msg.timestamp}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold border overflow-hidden ${
                  msg.role === 'user' 
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-300' 
                    : 'bg-blue-600 border-blue-500 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Logo showText={false} size="sm" />}
                </div>
                <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tr-none' 
                      : 'bg-blue-600/5 dark:bg-blue-600/10 text-zinc-900 dark:text-zinc-100 border border-blue-500/10 dark:border-blue-500/20 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-widest">
                    {msg.role === 'user' ? 'Você' : 'ASCEND AI'} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </p>
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border border-blue-500 shrink-0 overflow-hidden">
                  <Logo showText={false} size="sm" className="animate-pulse" />
                </div>
                <div className="bg-blue-600/5 dark:bg-blue-600/10 border border-blue-500/10 dark:border-blue-500/20 p-4 rounded-2xl rounded-tl-none">
                  <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl">
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex gap-2"
          >
            <Input 
              placeholder="Digite sua mensagem para o mentor..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl py-6 px-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-auto px-6 rounded-xl shadow-lg shadow-blue-600/20"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center mt-3 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldAlert className="w-3 h-3" /> Mentor de alta performance. Sem desculpas.
          </p>
        </div>
      </Card>
    </div>
  );
}
