import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Zap, Mail, Lock, User, CreditCard, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Logo } from './Logo';

interface AuthProps {
  onComplete: (isLogin: boolean) => void;
  onBack?: () => void;
}

export default function Auth({ onComplete, onBack }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    cpf: '',
    phone: ''
  });

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'phone') formattedValue = formatPhone(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success("Bem-vindo de volta!");
      } else {
        // Validation
        if (formData.cpf.length !== 14) {
          toast.error("CPF inválido. Use o padrão XXX.XXX.XXX-XX");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // Create initial profile
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            displayName: formData.fullName,
            email: formData.email,
            fullName: formData.fullName,
            cpf: formData.cpf,
            phone: formData.phone,
            onboardingComplete: false,
            streak: 0,
            xp: 0,
            level: 1,
            missionsCompleted: 0,
            mentalLevel: 1,
            physicalScore: 10,
            lastCheckIn: new Date().toISOString(),
            theme: 'dark',
            notifications: {
              enabled: true,
              challenges: true,
              reminders: true,
              progress: true,
              aiAlerts: true
            },
            interfaceSettings: {
              density: 'comfortable',
              animations: true
            },
            privacySettings: {
              shareProgress: true,
              encryptedChat: true,
              profileVisibility: true
            }
          });
          toast.success("Conta criada com sucesso!");
        } catch (dbError: any) {
          console.error("Database error during signup:", dbError);
          // Use our standard error handler for better diagnostics
          try {
            const { handleFirestoreError, OperationType } = await import('../contexts/ProfileContext');
            handleFirestoreError(dbError, OperationType.WRITE, `users/${user.uid}`);
          } catch (e) {
            // Fallback if context is not available
          }
          toast.warning("Conta criada, mas houve um erro ao salvar o perfil. Tente completar o cadastro.");
        }
      }
      
      // Only call onComplete for login. 
      // For signup, App.tsx will react to the user state change automatically.
      onComplete(isLogin);
    } catch (error: any) {
      console.error("Auth error details:", {
        code: error.code,
        message: error.message,
        email: formData.email,
        isLogin
      });
      let message = "Erro na autenticação";
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = isLogin 
          ? "E-mail ou senha incorretos. Se você acabou de resetar o app, crie uma nova conta."
          : "Erro ao criar conta. Verifique os dados e tente novamente.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "Este e-mail já está em uso.";
      } else if (error.code === 'auth/weak-password') {
        message = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
      {onBack && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack} 
          className="absolute top-6 left-6 text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden">
          <CardHeader className="space-y-4 text-center pb-8 border-b border-zinc-900">
            <div className="flex justify-center">
              <Logo showText={false} size="lg" className="shadow-[0_0_30px_rgba(37,99,235,0.3)]" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tighter text-white">
                {isLogin ? 'ENTRAR NA ASCENSÃO' : 'CRIAR CONTA'}
              </CardTitle>
              <CardDescription className="text-zinc-500">
                {isLogin 
                  ? 'Retome sua jornada rumo à alta performance.' 
                  : 'Inicie sua transformação hoje mesmo.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-zinc-600" />
                        <Input
                          name="fullName"
                          placeholder="Seu nome completo"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required={!isLogin}
                          className="pl-10 bg-zinc-900 border-zinc-800 text-white h-12"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-zinc-400">CPF</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-3 w-5 h-5 text-zinc-600" />
                          <Input
                            name="cpf"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={handleInputChange}
                            required={!isLogin}
                            className="pl-10 bg-zinc-900 border-zinc-800 text-white h-12"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Celular (DDD)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-5 h-5 text-zinc-600" />
                          <Input
                            name="phone"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required={!isLogin}
                            className="pl-10 bg-zinc-900 border-zinc-800 text-white h-12"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-600" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="pl-10 bg-zinc-900 border-zinc-800 text-white h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-600" />
                    <Input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="pl-10 bg-zinc-900 border-zinc-800 text-white h-12"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-14 rounded-xl text-lg shadow-lg shadow-blue-600/20"
              >
                {loading ? 'PROCESSANDO...' : (isLogin ? 'ENTRAR' : 'CRIAR CONTA')}
                {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-zinc-500 hover:text-white text-sm font-medium transition-colors"
                >
                  {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre agora'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
