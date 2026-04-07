import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Bell, Settings, User, LogOut, Moon, Sun, Palette, Check, Upload, Zap, Flame, ChevronDown, Camera, Image as ImageIcon, Shield, Database, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { useProfile } from '../contexts/ProfileContext';
import { auth, logOut } from '../lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface TopbarProps {
  profile: UserProfile;
}

export default function Topbar({ profile }: TopbarProps) {
  const { updateProfile } = useProfile();
  const [activeDropdown, setActiveDropdown] = useState<'profile' | 'settings' | 'notifications' | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showInterfaceSettings, setShowInterfaceSettings] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showDataSettings, setShowDataSettings] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  // Local state for profile edits
  const [localProfile, setLocalProfile] = useState({
    displayName: profile.displayName || '',
    nickname: profile.nickname || '',
    bio: profile.bio || ''
  });

  useEffect(() => {
    setLocalProfile({
      displayName: profile.displayName || '',
      nickname: profile.nickname || '',
      bio: profile.bio || ''
    });
  }, [profile.displayName, profile.nickname, profile.bio]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotification = (key: keyof NonNullable<UserProfile['notifications']>) => {
    const current = profile.notifications || {
      enabled: true,
      challenges: true,
      reminders: true,
      progress: true,
      aiAlerts: true
    };
    
    if (key === 'enabled') {
      const newState = !current.enabled;
      updateProfile({
        notifications: {
          enabled: newState,
          challenges: newState,
          reminders: newState,
          progress: newState,
          aiAlerts: newState
        }
      });
    } else {
      updateProfile({
        notifications: {
          ...current,
          [key]: !current[key]
        }
      });
    }
  };

  const handleDeleteData = async () => {
    if (!auth.currentUser) {
      toast.error("Você precisa estar logado para excluir seus dados.");
      return;
    }

    try {
      const confirmText = "EXCLUIR";
      const userInput = prompt(`Para confirmar a exclusão permanente de todos os seus dados, digite "${confirmText}":`);
      
      if (userInput === confirmText) {
        toast.loading("Excluindo seus dados...");
        await deleteDoc(doc(db, 'users', auth.currentUser.uid));
        await logOut();
        toast.success("Todos os seus dados foram apagados permanentemente.");
        window.location.reload();
      } else {
        toast.info("Exclusão cancelada.");
      }
    } catch (error) {
      console.error("Error deleting data:", error);
      toast.error("Erro ao excluir dados. Tente novamente.");
    }
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ photoURL: reader.result as string });
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        updateProfile({ photoURL: dataUrl });
        stopCamera();
        setShowPhotoOptions(false);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-900 bg-white/50 dark:bg-black/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile Spacer for Sidebar Toggle */}
        <div className="w-10 lg:hidden" />
      </div>

      <div className="flex items-center gap-2" ref={dropdownRef}>
        {/* Mobile Dropdown Backdrop */}
        <AnimatePresence>
          {activeDropdown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDropdown(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
            className={cn(
              "p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all relative",
              activeDropdown === 'notifications' && "bg-zinc-900 text-white"
            )}
          >
            <Bell className="w-5 h-5" />
            {profile.notifications?.enabled && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-black" />
            )}
          </button>

          <AnimatePresence>
            {activeDropdown === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-20 md:top-full mt-2 w-[calc(100vw-2rem)] max-w-sm md:w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70dvh] flex flex-col"
              >
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Notificações</h3>
                    <button 
                      onClick={() => {
                        toast.success("Todas as notificações marcadas como lidas.");
                        setActiveDropdown(null);
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-500 transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">Gerencie seus alertas e avisos do mentor.</p>
                </div>
                <div className="p-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                  {[
                    { key: 'challenges', label: 'Desafios', icon: '🔥', desc: 'Lembretes de desafios pendentes' },
                    { key: 'reminders', label: 'Lembretes', icon: '⏰', desc: 'Hora de entrar no app' },
                    { key: 'progress', label: 'Evolução', icon: '📈', desc: 'Relatórios de progresso' },
                    { key: 'aiAlerts', label: 'Alertas IA', icon: '🧠', desc: 'Insights do mentor' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => toggleNotification(item.key as any)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</p>
                          <p className="text-[10px] text-zinc-500">{item.desc}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-10 h-5 rounded-full transition-all relative shrink-0",
                        profile.notifications?.[item.key as keyof typeof profile.notifications] ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-800"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          profile.notifications?.[item.key as keyof typeof profile.notifications] ? "left-6" : "left-1"
                        )} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'settings' ? null : 'settings')}
            className={cn(
              "p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all",
              activeDropdown === 'settings' && "bg-zinc-900 text-white"
            )}
          >
            <Settings className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {activeDropdown === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-20 md:top-full mt-2 w-[calc(100vw-2rem)] max-w-sm md:w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70dvh] flex flex-col"
              >
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 shrink-0">
                  <h3 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Configurações</h3>
                  <p className="text-xs text-zinc-500 mt-1">Personalize sua experiência visual e de dados.</p>
                </div>
                <div className="p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Tema do Sistema
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'light', icon: Sun, label: 'Claro' },
                        { id: 'dark', icon: Moon, label: 'Escuro' },
                        { id: 'system', icon: Settings, label: 'Auto' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => updateProfile({ theme: t.id as any })}
                          className={cn(
                            "flex flex-col items-center gap-2 p-2 rounded-xl border transition-all",
                            profile.theme === t.id 
                              ? "bg-blue-600/10 border-blue-600 text-blue-500" 
                              : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                          )}
                        >
                          <t.icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Preferências Gerais
                    </Label>
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setActiveDropdown(null);
                          setShowInterfaceSettings(true);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-xs font-bold"
                      >
                        <Palette className="w-4 h-4 text-blue-500" />
                        Ajustes de Interface
                      </button>
                      <button 
                        onClick={() => {
                          setActiveDropdown(null);
                          setShowPrivacySettings(true);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-xs font-bold"
                      >
                        <Shield className="w-4 h-4 text-purple-500" />
                        Privacidade e Dados
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button 
                      onClick={async () => {
                        setActiveDropdown(null);
                        try {
                          toast.info("Saindo da conta...");
                          await logOut();
                          toast.success("Você saiu com sucesso.");
                        } catch (error) {
                          console.error("Logout error:", error);
                          toast.error("Erro ao sair da conta.");
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-all text-left group"
                    >
                      <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-500" />
                      <span className="text-sm font-medium text-zinc-300 group-hover:text-red-500">Sair da Conta</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative ml-2">
          <div
            className={cn(
              "flex items-center gap-3 p-1 pr-1 rounded-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all group",
              activeDropdown === 'profile' && "bg-zinc-900 border-zinc-700"
            )}
          >
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
              className="flex items-center gap-3 pl-0 pr-2 rounded-full transition-all text-left"
            >
              <Avatar className="w-8 h-8 border border-zinc-800">
                <AvatarImage src={profile.photoURL} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xs font-black">
                  {profile.displayName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-white leading-none">{profile.nickname || profile.displayName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Flame className="w-2.5 h-2.5 text-orange-500 fill-orange-500" />
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{profile.streak} DIAS</span>
                </div>
              </div>
            </button>
            <div className="flex items-center pr-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPhotoOptions(true);
                }}
                className="p-1 hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-white"
                title="Trocar foto de perfil"
              >
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  activeDropdown === 'profile' && "rotate-180"
                )} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {activeDropdown === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-20 md:top-full mt-2 w-[calc(100vw-2rem)] md:w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70dvh] flex flex-col"
              >
                <div className="p-6 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-900 dark:to-black border-b border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-4 shrink-0">
                  <div className="relative group">
                    <Avatar className="w-20 h-20 border-2 border-blue-600 shadow-2xl">
                      <AvatarImage src={profile.photoURL} />
                      <AvatarFallback className="bg-zinc-200 dark:bg-zinc-900 text-2xl font-black text-zinc-900 dark:text-white">
                        {profile.displayName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <button 
                      onClick={() => setShowPhotoOptions(true)}
                      className="absolute -bottom-1 -right-1 p-2 bg-blue-600 rounded-full text-white shadow-lg hover:scale-110 transition-all border-2 border-white dark:border-zinc-950"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white">{profile.displayName}</h3>
                    <p className="text-xs text-zinc-500">{profile.email}</p>
                  </div>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Informações Básicas</Label>
                      <Input 
                        placeholder="Nome Completo" 
                        value={localProfile.displayName} 
                        onChange={(e) => setLocalProfile(prev => ({ ...prev, displayName: e.target.value }))}
                        className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs h-10"
                      />
                      <Input 
                        placeholder="Apelido" 
                        value={localProfile.nickname} 
                        onChange={(e) => setLocalProfile(prev => ({ ...prev, nickname: e.target.value }))}
                        className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bio / Descrição</Label>
                      <textarea 
                        placeholder="Conte um pouco sobre você..." 
                        value={localProfile.bio} 
                        onChange={(e) => setLocalProfile(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white text-xs min-h-[80px] focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          updateProfile(localProfile);
                          setActiveDropdown(null);
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                      >
                        Salvar Alterações
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Abordagem do Mentor</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'direct', label: 'Direto' },
                          { id: 'encouraging', label: 'Motivador' },
                          { id: 'philosophical', label: 'Filosófico' },
                          { id: 'hardcore', label: 'Hardcore' },
                        ].map((a) => (
                          <button
                            key={a.id}
                            onClick={() => updateProfile({ aiApproach: a.id as any })}
                            className={cn(
                              "px-3 py-2 rounded-xl border text-[10px] font-bold transition-all",
                              profile.aiApproach === a.id 
                                ? "bg-blue-600 border-blue-600 text-white" 
                                : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                            )}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Photo Options Dialog */}
      <Dialog open={showPhotoOptions} onOpenChange={(open) => {
        if (!open) stopCamera();
        setShowPhotoOptions(open);
      }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">FOTO DE PERFIL</DialogTitle>
            <DialogDescription className="text-zinc-400">Escolha como deseja atualizar sua foto.</DialogDescription>
          </DialogHeader>
          
          {showCamera ? (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-2">
                <Button onClick={capturePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold">TIRAR FOTO</Button>
                <Button onClick={stopCamera} variant="outline" className="border-zinc-800">CANCELAR</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="h-16 justify-start gap-4 border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold"
              >
                <ImageIcon className="w-6 h-6 text-blue-500" />
                GALERIA / UPLOAD
              </Button>
              <Button 
                variant="outline" 
                onClick={startCamera}
                className="h-16 justify-start gap-4 border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold"
              >
                <Camera className="w-6 h-6 text-purple-500" />
                USAR CÂMERA
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Interface Settings Dialog */}
      <Dialog open={showInterfaceSettings} onOpenChange={setShowInterfaceSettings}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">AJUSTES DE INTERFACE</DialogTitle>
            <DialogDescription className="text-zinc-400">Personalize sua experiência visual.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label className="text-sm font-bold text-zinc-300">Densidade da Interface</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateProfile({ interfaceSettings: { ...profile.interfaceSettings, density: 'comfortable', animations: profile.interfaceSettings?.animations ?? true } })}
                  className={cn(
                    "border-zinc-800 transition-all",
                    profile.interfaceSettings?.density === 'comfortable' ? "bg-blue-600/10 border-blue-600 text-blue-500" : "text-zinc-500"
                  )}
                >
                  Confortável
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => updateProfile({ interfaceSettings: { ...profile.interfaceSettings, density: 'compact', animations: profile.interfaceSettings?.animations ?? true } })}
                  className={cn(
                    "border-zinc-800 transition-all",
                    profile.interfaceSettings?.density === 'compact' ? "bg-blue-600/10 border-blue-600 text-blue-500" : "text-zinc-500"
                  )}
                >
                  Compacto
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <Label className="text-sm font-bold text-zinc-300">Animações</Label>
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                <span className="text-sm text-zinc-400">Ativar efeitos visuais</span>
                <Checkbox 
                  checked={profile.interfaceSettings?.animations ?? true} 
                  onCheckedChange={(checked) => updateProfile({ interfaceSettings: { ...profile.interfaceSettings, density: profile.interfaceSettings?.density ?? 'comfortable', animations: !!checked } })}
                  className="border-zinc-700 data-[state=checked]:bg-blue-600" 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowInterfaceSettings(false)} 
              className="bg-blue-600 hover:bg-blue-700 font-bold w-full"
            >
              FECHAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Settings Dialog */}
      <Dialog open={showPrivacySettings} onOpenChange={setShowPrivacySettings}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">PRIVACIDADE E DADOS</DialogTitle>
            <DialogDescription className="text-zinc-400">Gerencie como suas informações são tratadas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { key: 'shareProgress', label: 'Compartilhar progresso anonimamente', desc: 'Ajuda a melhorar a IA para todos' },
              { key: 'encryptedChat', label: 'Histórico de chat criptografado', desc: 'Suas conversas são privadas' },
              { key: 'profileVisibility', label: 'Visibilidade de perfil', desc: 'Permitir que outros vejam seu nível' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-zinc-500">{item.desc}</p>
                </div>
                <Checkbox 
                  checked={profile.privacySettings?.[item.key as keyof typeof profile.privacySettings] ?? true} 
                  onCheckedChange={(checked) => updateProfile({ privacySettings: { ...profile.privacySettings, [item.key]: !!checked } })}
                  className="border-zinc-700 data-[state=checked]:bg-blue-600" 
                />
              </div>
            ))}
            <button 
              onClick={handleDeleteData}
              className="w-full bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20 font-bold mt-4 py-3 rounded-xl transition-all"
            >
              EXCLUIR TODOS OS MEUS DADOS
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
