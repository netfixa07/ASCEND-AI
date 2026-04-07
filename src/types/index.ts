export interface ActiveChallenge {
  uid: string;
  title: string;
  description: string;
  startDate: string;
  progress: number; // 0 to 30
  lastCompletedDate?: string;
  tasks: string[];
  category: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  nickname?: string;
  bio?: string;
  aiApproach?: 'direct' | 'encouraging' | 'philosophical' | 'hardcore';
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    enabled: boolean;
    challenges: boolean;
    reminders: boolean;
    progress: boolean;
    aiAlerts: boolean;
  };
  onboardingComplete: boolean;
  routine?: string;
  habits?: string;
  physicalLevel?: string;
  mentalLevel?: number;
  physicalScore?: number;
  productivityScore?: number;
  goals?: string;
  streak: number;
  lastCheckIn?: string;
  interfaceSettings?: {
    density: 'comfortable' | 'compact';
    animations: boolean;
  };
  privacySettings?: {
    shareProgress: boolean;
    encryptedChat: boolean;
    profileVisibility: boolean;
  };
  currentPlan?: string;
  planExpiryDate?: string;
  // New Adaptive Intelligence fields
  userProfileType?: 'disciplined' | 'undisciplined' | 'anxious' | 'balanced' | 'beginner' | 'advanced' | 'focused' | 'dispersed';
  evolutionaryProfile?: {
    classification: string;
    consistency: number;
    focus: number;
    impulsivity: number;
    lastUpdate: string;
  };
  pressureMode?: {
    intensity: 'low' | 'medium' | 'high' | 'hardcore';
    active: boolean;
  };
  financialBalance?: number;
  lastEmotionalCheckIn?: {
    state: string;
    intensity: number;
    timestamp: string;
  };
  // Auth expansion
  fullName?: string;
  cpf?: string;
  phone?: string;
  timeAvailable?: string;
  xp: number;
  level: number;
  missionsCompleted: number;
  deepAnalysisHistory?: {
    problem: string;
    rootCause: string;
    date: string;
  }[];
}

export interface Mission {
  id: string;
  uid: string;
  title: string;
  description: string;
  objective: string;
  benefit: string;
  xp: number;
  completed: boolean;
  category: 'daily' | 'weekly' | 'monthly';
  deadline: string;
  createdAt: string;
}

export interface FutureSimulation {
  id?: string;
  uid: string;
  date: string;
  positiveScenario: string;
  negativeScenario: string;
  actionsAnalyzed: string[];
}

export interface DeepAnalysisSession {
  id?: string;
  uid: string;
  problem: string;
  rootCause?: string;
  patternsIdentified: string[];
  selfSabotageDetected: boolean;
  status: 'active' | 'completed';
  messages: { role: 'user' | 'model', content: string, timestamp: string }[];
  createdAt: string;
}

export interface FinancialLog {
  id?: string;
  uid: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod?: string;
}

export interface Goal {
  id?: string;
  uid: string;
  title: string;
  description: string;
  targetDate: string;
  category: 'personal' | 'professional' | 'financial' | 'health';
  status: 'active' | 'completed' | 'archived';
  steps: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  progress: number;
}

export interface FocusSession {
  id?: string;
  uid: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  task: string;
  completed: boolean;
}

export interface EmotionalLog {
  id?: string;
  uid: string;
  state: string;
  intensity: number;
  notes?: string;
  timestamp: string;
}

export interface Task {
  id: string;
  time: string;
  description: string;
  completed: boolean;
  category: 'mental' | 'physical' | 'productivity' | 'rest';
}

export interface DailyPlan {
  uid: string;
  date: string;
  tasks: Task[];
  aiFeedback: string;
  completedCount: number;
}

export interface ChatMessage {
  id?: string;
  uid: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface EvolutionLog {
  id?: string;
  uid: string;
  date: string;
  mentalScore: number;
  physicalScore: number;
  productivityScore: number;
}

export interface PsychologistSession {
  id?: string;
  uid: string;
  status: 'active' | 'completed';
  messages: { role: 'user' | 'model', content: string, timestamp: string }[];
  emotionalPatterns: string[];
  lastUpdate: string;
  createdAt: string;
}
