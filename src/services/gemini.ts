import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o Arquiteto Chefe da ASCEND AI, a plataforma de evolução humana mais avançada do mundo. Seu objetivo não é apenas ajudar o usuário, mas transformá-lo em uma versão de alta performance (nível elite global).

SUA FILOSOFIA:
- Disciplina é a única liberdade real.
- Resultados não mentem; intenções sim.
- A evolução é um jogo de estratégia, não de sorte.

SUAS DIRETRIZES DE INTELIGÊNCIA:
1. ANÁLISE PSICOLÓGICA PROFUNDA: Use cada interação para mapear a psique do usuário. Identifique medos, gatilhos de procrastinação e padrões de autossabotagem.
2. ADAPTAÇÃO DINÂMICA: Classifique o usuário continuamente (Ex: "Guerreiro Consistente", "Iniciante Disperso", "Estrategista Ansioso").
3. LINGUAGEM DE ALTO IMPACTO:
   - Se o usuário está em "Modo Pressão Hardcore", seja implacável. Não aceite desculpas. Use tom militar/executivo.
   - Se o usuário está evoluindo, valide com dados, não apenas elogios vazios.
   - Use termos como "ROI de tempo", "alavancagem estratégica", "otimização biológica".

FUNÇÕES ELITE INTEGRADAS:
1. RAIZ DO PROBLEMA: Não aceite a primeira resposta. Vá fundo. Se ele diz "estou cansado", investigue se é falta de sono, falta de propósito ou fuga emocional.
2. SIMULADOR DE FUTURO: Seja brutalmente honesto. Mostre a decadência no cenário negativo e a glória no positivo.
3. PRESSÃO INTELIGENTE: Saiba quando apertar e quando aliviar. Se o usuário falha repetidamente, aumente a voltagem da cobrança.
4. GAMIFICAÇÃO ESTRATÉGICA: Gere missões que ataquem as fraquezas do usuário. Se ele é disperso, dê missões de foco longo.

REGRAS DE OURO:
- Seja o mentor que o usuário precisa, não o que ele quer.
- Respostas curtas, densas e extremamente práticas.
- Use a memória de longo prazo para criar um senso de continuidade e evolução real.

FRASE GUIA: "A ASCEND AI não apenas te ajuda... ela evolui com você."
`;

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export const getMentorResponse = async (prompt: string, history: any[] = [], userData?: any) => {
  try {
    const ai = getGenAI();
    const model = "gemini-3-flash-preview";
    
    const approachInstructions = userData?.aiApproach ? `
    ABORDAGEM DO MENTOR: Você deve agir com a abordagem "${userData.aiApproach}".
    - direct: Seja extremamente direto, sem rodeios.
    - encouraging: Seja motivador e empático, mas mantenha a autoridade.
    - philosophical: Use metáforas e reflexões sobre a vida e o propósito.
    - hardcore: Seja duro, exija o máximo, não aceite desculpas (estilo militar).
    ` : "";

    const pressureInstructions = userData?.pressureMode?.active ? `
    MODO PRESSÃO ATIVO (Intensidade: ${userData.pressureMode.intensity}): Seja mais exigente, cobre resultados, não aceite mediocridade.
    ` : "";

    const profileInstructions = userData?.evolutionaryProfile ? `
    PERFIL ATUAL DO USUÁRIO: ${userData.evolutionaryProfile.classification}. 
    Consistência: ${userData.evolutionaryProfile.consistency}%, Foco: ${userData.evolutionaryProfile.focus}%, Impulsividade: ${userData.evolutionaryProfile.impulsivity}%.
    Ajuste sua linguagem para este perfil.
    ` : "";

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + approachInstructions + pressureInstructions + profileInstructions,
        temperature: 0.7,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error in getMentorResponse:", error);
    return "Desculpe, tive um problema ao processar sua solicitação. Tente novamente em alguns instantes.";
  }
};

export const generateDailyPlan = async (userData: any) => {
  try {
    const ai = getGenAI();
    const model = "gemini-3-flash-preview";
    const prompt = `Com base nos dados do usuário: ${JSON.stringify(userData)}, gere um plano diário prático em formato JSON com a seguinte estrutura:
    {
      "tasks": [
        { "time": "06:00", "description": "Acordar e meditar", "category": "mental" }
      ],
      "aiFeedback": "Feedback curto e direto"
    }`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("Error generating daily plan:", e);
    return { 
      tasks: [
        { "time": "08:00", "description": "Foco total na tarefa mais importante", "category": "productivity" },
        { "time": "12:00", "description": "Pausa estratégica e hidratação", "category": "rest" },
        { "time": "18:00", "description": "Revisão do dia e planejamento de amanhã", "category": "mental" }
      ], 
      aiFeedback: "Tivemos um problema técnico ao gerar seu plano personalizado, mas aqui está uma estrutura base para você não perder o ritmo." 
    };
  }
};

export const generate30DayChallenge = async (userData: any) => {
  try {
    const ai = getGenAI();
    const model = "gemini-3-flash-preview";
    const prompt = `Com base nos dados do usuário: ${JSON.stringify(userData)}, gere um desafio de 30 dias personalizado. O usuário quer melhorar em: ${userData.goals}.
    
    DIRETRIZES DE CLAREZA:
    - Cada tarefa deve ser OBJETIVA e MENSURÁVEL (Ex: "Correr 2km" em vez de "Fazer exercício").
    - Use verbos de ação claros.
    - Explique brevemente o "COMO" se a tarefa for complexa.
    - A dificuldade deve escalar de forma lógica.

    Gere um JSON com a seguinte estrutura:
    {
      "title": "Título Impactante e Motivador",
      "description": "Explicação clara do propósito do desafio e o que se espera alcançar.",
      "tasks": ["Tarefa Dia 1: [Ação Clara]", "Tarefa Dia 2: [Ação Clara]", ..., "Tarefa Dia 30: [Ação Clara]"],
      "category": "mental | physical | productivity"
    }
    IMPORTANTE: Gere EXATAMENTE 30 tarefas diferentes, uma para cada dia.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("Error generating 30 day challenge:", e);
    return {
      title: "Desafio de Resiliência Ascendente",
      description: "Um desafio base focado em construir disciplina inabalável enquanto resolvemos problemas técnicos.",
      tasks: Array(30).fill("Realizar 15 minutos de foco total na sua prioridade #1 do dia."),
      category: "mental"
    };
  }
};

export const analyzeRootCause = async (userData: any, problem: string, history: any[] = []) => {
  try {
    const ai = getGenAI();
    const model = "gemini-3-flash-preview";
    const prompt = `O usuário está relatando o seguinte problema: "${problem}". 
    Como especialista em análise comportamental, conduza uma análise profunda para encontrar a RAIZ DO PROBLEMA.
    Identifique padrões de autossabotagem e sugira uma ação prática imediata.
    Retorne um JSON com a seguinte estrutura:
    {
      "analysis": "Sua análise profunda e direta",
      "rootCause": "A causa raiz identificada",
      "patterns": ["Padrão 1", "Padrão 2"],
      "selfSabotage": true,
      "immediateAction": "Ação prática agora",
      "nextQuestion": "Uma pergunta estratégica para aprofundar"
    }`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("Error in analyzeRootCause:", e);
    return { 
      analysis: "Não foi possível realizar a análise profunda no momento devido a uma instabilidade técnica.", 
      rootCause: "Indefinida", 
      patterns: ["Instabilidade técnica"], 
      selfSabotage: false, 
      immediateAction: "Tente novamente em alguns instantes.", 
      nextQuestion: "Como você se sente em relação a esse obstáculo?" 
    };
  }
};

export const simulateFuture = async (userData: any) => {
  try {
    const ai = getGenAI();
    const model = "gemini-3-flash-preview";
    const prompt = `Com base nos dados atuais do usuário: ${JSON.stringify(userData)}, projete o futuro dele em 1 ano, 5 anos e 10 anos.
    Gere dois cenários:
    1. CENÁRIO NEGATIVO: Se ele continuar com os hábitos atuais ruins e inconsistências.
    2. CENÁRIO POSITIVO: Se ele seguir o plano de ascensão com disciplina máxima.
    Retorne um JSON:
    {
      "negative": { "1year": "...", "5years": "...", "10years": "..." },
      "positive": { "1year": "...", "5years": "...", "10years": "..." },
      "warning": "Um alerta impactante sobre as escolhas atuais"
    }`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    
    const data = JSON.parse(response.text || "{}");
    return {
      negative: data.negative || { "1year": "", "5years": "", "10years": "" },
      positive: data.positive || { "1year": "", "5years": "", "10years": "" },
      warning: data.warning || "Continue focado na sua evolução."
    };
  } catch (e) {
    console.error("Error in simulateFuture:", e);
    return { 
      negative: { "1year": "Estagnação e perda de potencial.", "5years": "Acúmulo de arrependimentos.", "10years": "Vida abaixo do que você é capaz." }, 
      positive: { "1year": "Resultados visíveis e nova mentalidade.", "5years": "Liberdade e maestria pessoal.", "10years": "Legado e plenitude absoluta." }, 
      warning: "O sistema de simulação falhou, mas seu futuro é real. Escolha a disciplina." 
    };
  }
};

export const generateMissions = async (userData: any) => {
  try {
    const ai = getGenAI();
    const model = "gemini-3-flash-preview";
    const prompt = `Gere 3 missões estratégicas para o usuário com base no seu perfil: ${JSON.stringify(userData)}.
    
    DIRETRIZES DE MISSÃO ELITE:
    - CLAREZA TOTAL: Qualquer pessoa deve entender exatamente o que fazer ao ler.
    - OBJETIVIDADE: Sem termos vagos. Use números, tempos ou ações físicas específicas.
    - ESTRUTURA PASSO A PASSO: Se necessário, descreva a execução em etapas curtas.
    - PROPÓSITO: O campo 'objective' deve dizer O QUE estamos atacando (ex: procrastinação).
    - IMPACTO: O campo 'benefit' deve dizer COMO isso muda a vida do usuário hoje.

    Retorne um JSON:
    {
      "missions": [
        { 
          "title": "Título de Impacto", 
          "description": "Instrução clara e objetiva do que fazer (Ex: 'Desligue o celular por 60 min e escreva 3 metas').", 
          "objective": "O alvo estratégico desta missão.",
          "benefit": "O ganho real e imediato de performance.",
          "xp": 50, 
          "category": "daily" 
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    
    const data = JSON.parse(response.text || "{}");
    return data.missions || [];
  } catch (e) {
    console.error("Error generating missions:", e);
    return [
      {
        title: "Missão de Contingência: Foco Inabalável",
        description: "Desligue todas as notificações por 1 hora e foque no seu trabalho mais difícil.",
        objective: "Recuperar o controle da atenção.",
        benefit: "Aumento imediato de produtividade.",
        xp: 100,
        category: "productivity"
      }
    ];
  }
};

export const updateEvolutionaryProfile = async (userData: any, actions: any[]) => {
  try {
    const ai = getGenAI();
    const model = "gemini-3-flash-preview";
    const prompt = `Analise o histórico recente de ações do usuário: ${JSON.stringify(actions)}.
    Com base nos dados do perfil: ${JSON.stringify(userData)}, atualize a classificação evolutiva dele.
    Retorne um JSON:
    {
      "classification": "Ex: Guerreiro Consistente / Iniciante Disperso",
      "consistency": 85,
      "focus": 70,
      "impulsivity": 20,
      "feedback": "Feedback curto sobre a mudança de perfil"
    }`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("Error updating evolutionary profile:", e);
    return {
      classification: userData?.evolutionaryProfile?.classification || "Em Evolução",
      consistency: userData?.evolutionaryProfile?.consistency || 50,
      focus: userData?.evolutionaryProfile?.focus || 50,
      impulsivity: userData?.evolutionaryProfile?.impulsivity || 50,
      feedback: "O sistema de análise evolutiva está temporariamente offline, mas sua jornada continua."
    };
  }
};

const PSYCHOLOGIST_SYSTEM_INSTRUCTION = `
Você é a Dra. Elena, uma Psicóloga IA Humanizada de alto nível integrada à plataforma ASCEND AI.
Sua missão é fornecer suporte emocional, autoconhecimento e saúde mental para usuários de alta performance.

DIRETRIZES DE COMPORTAMENTO:
1. EMPATIA E ACOLHIMENTO: Seja calorosa, valide as emoções do usuário. Use frases como "Eu entendo como isso pode ser difícil" ou "É perfeitamente normal se sentir assim".
2. ESCUTA ATIVA: Não dê conselhos imediatos. Faça perguntas reflexivas baseadas no que o usuário disse. Explore o "como" e o "porquê".
3. PROFISSIONALISMO ÉTICO: Mantenha um tom clínico mas humanizado. Não julgue.
4. IDENTIFICAÇÃO EMOCIONAL: Fique atenta a sinais de ansiedade, estresse, desmotivação, tristeza ou sobrecarga.
5. INTERVENÇÕES LEVES: Sugira técnicas de respiração, reflexões guiadas ou mudanças de perspectiva quando apropriado.
6. MEMÓRIA E EVOLUÇÃO: Lembre-se de padrões emocionais e recorrências mencionadas anteriormente.

LIMITES ÉTICOS (CRÍTICO):
- Você NÃO substitui um psicólogo real.
- Você NÃO diagnostica doenças mentais.
- Você NÃO prescreve medicamentos.
- Se o usuário demonstrar risco de vida ou crise grave, recomende IMEDIATAMENTE ajuda profissional real (CVV 188 no Brasil).

FRASE GUIA: "Você não está sozinho. Aqui, você é compreendido."
`;

export const getPsychologistResponse = async (prompt: string, history: any[] = [], userData?: any) => {
  try {
    const ai = getGenAI();
    const model = "gemini-3-flash-preview";
    
    const context = `
    CONTEXTO DO USUÁRIO:
    Nome: ${userData?.displayName || 'Usuário'}
    Perfil: ${userData?.userProfileType || 'Não definido'}
    Rotina: ${userData?.routine || 'Não informada'}
    Objetivos: ${userData?.goals || 'Não informados'}
    Estado Emocional Recente: ${userData?.lastEmotionalCheckIn?.state || 'Não registrado'}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: PSYCHOLOGIST_SYSTEM_INSTRUCTION + context,
        temperature: 0.8,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error in getPsychologistResponse:", error);
    return "Sinto muito, tive um pequeno problema técnico agora. Mas estou aqui com você. Pode repetir o que disse?";
  }
};
