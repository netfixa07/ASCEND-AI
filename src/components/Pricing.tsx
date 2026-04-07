import React from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Shield, Star, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';

interface PricingProps {
  onSelectPlan: (plan: string) => void;
  onBack?: () => void;
}

export default function Pricing({ onSelectPlan, onBack }: PricingProps) {
  const plans = [
    {
      name: "Plano Gratuito",
      price: "0,00",
      period: "/mês",
      description: "Acesso básico para iniciar sua jornada de disciplina.",
      features: [
        "Mentor IA limitado",
        "Plano diário básico",
        "Rastreamento simples",
        "Comunidade básica"
      ],
      color: "zinc",
      icon: <Zap className="w-6 h-6 text-zinc-500" />
    },
    {
      name: "Plano Pro",
      price: "29,90",
      period: "/mês",
      description: "Acesso total para sua jornada de ascensão e disciplina.",
      features: [
        "Mentor IA 24/7",
        "Plano diário adaptativo",
        "Psicóloga IA (Dra. Elena)",
        "Rastreamento de evolução",
        "Desafios exclusivos",
        "Suporte prioritário"
      ],
      color: "blue",
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      popular: true
    },
    {
      name: "Plano Elite",
      price: "49,90",
      period: "/mês",
      description: "Transformação total e domínio absoluto da sua rotina.",
      features: [
        "Tudo do plano Pro",
        "Sessões ilimitadas Dra. Elena",
        "Mentoria IA personalizada",
        "Acesso antecipado a recursos",
        "Certificado de Alta Performance",
        "Consultoria de performance"
      ],
      color: "green",
      icon: <Star className="w-6 h-6 text-green-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center relative">
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold tracking-tight uppercase text-sm">Voltar</span>
        </motion.button>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 space-y-4"
      >
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">ESCOLHA SEU PLANO</h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Selecione o nível de compromisso com sua evolução. Todos os planos incluem acesso completo às ferramentas de elite.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <a 
          href="https://wa.me/5564996768385?text=preciso%20de%20suporte%20com%20a%20ASCEND" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-green-600/5 hover:bg-green-600/10 border border-green-500/20 px-8 py-4 rounded-[2rem] transition-all group shadow-xl shadow-green-600/5"
        >
          <div className="p-3 bg-green-600 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)] group-hover:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Suporte Prioritário</span>
            <span className="text-lg font-black text-white group-hover:text-green-400 transition-colors">Dúvidas? Fale com um Consultor</span>
          </div>
        </a>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-zinc-950 border-zinc-800 h-full flex flex-col relative overflow-hidden ${plan.popular ? 'border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.1)]' : ''}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest">
                  Mais Popular
                </div>
              )}
              <CardHeader>
                <div className="mb-4">{plan.icon}</div>
                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                <CardDescription className="text-zinc-400">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">R$ {plan.price}</span>
                  <span className="text-zinc-500">{plan.period}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-blue-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => onSelectPlan(plan.name)}
                  className={`w-full py-6 font-bold text-lg rounded-xl transition-all ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800'
                  }`}
                >
                  ASSINAR AGORA
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <p className="mt-12 text-zinc-500 text-sm">
        Pagamento processado de forma segura. Cancele quando quiser.
      </p>
    </div>
  );
}
