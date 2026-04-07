import { UserProfile } from '../types';
import { LayoutDashboard, Calendar, MessageSquare, TrendingUp, Trophy, LogOut, Zap, Flame, ChevronLeft, ChevronRight, Menu, X, CreditCard, Wallet, Brain, Heart, Target, Gamepad2, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useProfile } from '../contexts/ProfileContext';
import { Logo } from './Logo';
import { logOut } from '../lib/firebase';
import { toast } from 'sonner';

interface SidebarProps {
  profile: UserProfile;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBackToPlans: () => void;
}

interface NavItemProps {
  item: {
    value: string;
    icon: any;
    label: string;
  };
  activeTab: string;
  isCollapsed: boolean;
  onTabChange: (tab: string) => void;
  setIsMobileOpen: (open: boolean) => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, activeTab, isCollapsed, onTabChange, setIsMobileOpen }) => {
  const isActive = activeTab === item.value;
  
  const handleClick = () => {
    onTabChange(item.value);
    setIsMobileOpen(false);
  };

  const className = cn(
    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
    isActive 
      ? "text-white" 
      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
  );

  const innerContent = (
    <>
      {isActive && (
        <motion.div
          layoutId="active-nav-bg"
          className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      <item.icon className={cn(
        "w-5 h-5 shrink-0 transition-transform duration-200 relative z-10",
        isActive ? "scale-110" : "group-hover:scale-110"
      )} />
      
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="font-semibold tracking-tight whitespace-nowrap relative z-10"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {isActive && (
        <motion.span
          layoutId="active-pill"
          className="absolute left-0 w-1 h-6 bg-white rounded-r-full z-10"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={handleClick}
              className={className}
              type="button"
            />
          }
        >
          {innerContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button onClick={handleClick} className={className} type="button">
      {innerContent}
    </button>
  );
};

export default function Sidebar({ profile, activeTab, onTabChange, onBackToPlans }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      toast.info("Saindo da conta...");
      await logOut();
      toast.success("Você saiu com sucesso.");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Erro ao sair da conta.");
    }
  };

  const menuItems = [
    { value: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { value: 'plan', icon: Calendar, label: 'Plano Diário' },
    { value: 'chat', icon: MessageSquare, label: 'Mentor IA' },
    { value: 'deep-analysis', icon: Brain, label: 'Raiz do Problema' },
    { value: 'future', icon: TrendingUp, label: 'Simulador de Futuro' },
    { value: 'missions', icon: Gamepad2, label: 'Missões' },
    { value: 'profile-evolution', icon: User, label: 'Perfil Evolutivo' },
    { value: 'focus', icon: Zap, label: 'Modo Foco' },
    { value: 'goals', icon: Target, label: 'Objetivos' },
    { value: 'finance', icon: Wallet, label: 'Finanças' },
    { value: 'psychologist', icon: Heart, label: 'Psicóloga IA' },
    { value: 'emotional', icon: Heart, label: 'Suporte Emocional' },
    { value: 'challenges', icon: Trophy, label: 'Desafios' },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button
          variant="outline"
          size="icon"
          className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 shadow-xl transition-all duration-300 rounded-xl"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Desktop Toggle Button (Integrated) */}
      <div className="hidden lg:block fixed bottom-8 left-4 z-[60]">
        <Button
          variant="outline"
          size="icon"
          className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 shadow-xl transition-all duration-300 rounded-xl"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.nav
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 280,
          x: isDesktop ? 0 : (isMobileOpen ? 0 : -280)
        }}
        className={cn(
          "fixed lg:sticky top-0 left-0 h-[100dvh] z-[55] flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none",
          !isDesktop && !isMobileOpen && "-translate-x-full"
        )}
      >
        {/* Header / Logo */}
        <div className={cn(
          "p-6 flex items-center justify-between transition-all duration-300",
          isCollapsed ? "px-4 justify-center" : "px-6"
        )}>
          <Logo showText={!isCollapsed} size="sm" />
          
          {!isDesktop && (
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="lg:hidden text-zinc-400">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 pl-6 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {menuItems.map((item) => (
            <NavItem 
              key={item.value} 
              item={item} 
              activeTab={activeTab} 
              isCollapsed={isCollapsed} 
              onTabChange={onTabChange} 
              setIsMobileOpen={setIsMobileOpen} 
            />
          ))}
          {/* Bottom padding to ensure last item is visible */}
          <div className="h-10 lg:hidden" />
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/50 space-y-2">
          <Button
            variant="ghost"
            asChild
            className={cn(
              "w-full justify-start gap-3 text-green-600 hover:text-green-700 hover:bg-green-500/10 rounded-xl py-6",
              isCollapsed && "justify-center px-0"
            )}
          >
            <a href="https://wa.me/5564996768385?text=preciso%20de%20suporte%20com%20a%20ASCEND" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 fill-green-600" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {!isCollapsed && <span className="font-bold">Suporte WhatsApp</span>}
            </a>
          </Button>

          <Button
            variant="ghost"
            onClick={onBackToPlans}
            className={cn(
              "w-full justify-start gap-3 text-zinc-500 dark:text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl py-6",
              isCollapsed && "justify-center px-0"
            )}
          >
            <CreditCard className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-bold">Planos de Assinatura</span>}
          </Button>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl py-6",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-bold">Sair</span>}
          </Button>
        </div>
      </motion.nav>
    </>
  );
}
