import React from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

export function APIKeyWarning() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const isMissing = !geminiKey || geminiKey.trim() === "" || geminiKey.includes("TODO") || geminiKey.includes("YOUR_API_KEY");

  if (!isMissing) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Alert variant="destructive" className="bg-red-600 text-white border-none shadow-2xl rounded-2xl p-6">
        <ShieldAlert className="h-6 w-6 text-white" />
        <AlertTitle className="text-lg font-black tracking-tight mb-2 uppercase">ERRO DE CONFIGURAÇÃO</AlertTitle>
        <AlertDescription className="text-sm font-medium opacity-90 leading-relaxed">
          A chave de API do Gemini (GEMINI_API_KEY) não foi detectada. As funções de IA (Mentor, Psicóloga, Análise) não funcionarão.
          <div className="mt-4 p-3 bg-black/20 rounded-xl text-xs font-mono break-all">
            Status: {geminiKey ? 'Placeholder detectado' : 'Não encontrada'}
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold rounded-lg"
              onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
            >
              OBTER CHAVE <ExternalLink className="ml-2 w-3 h-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
