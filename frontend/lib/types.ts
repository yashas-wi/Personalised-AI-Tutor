// TypeScript interfaces for AI Tutor application

export interface User {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface TopicProgress {
  topic_slug: string;
  topic_name: string;
  mastery_score: number;
  lessons_completed: number;
  quiz_attempts: number;
}

export interface ProgressSummary {
  user: User;
  overall_mastery: number;
  topics: TopicProgress[];
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface LessonSection {
  title: string;
  content: string;
}

export interface LessonContent {
  topic_slug: string;
  topic_name: string;
  level: string;
  sections: LessonSection[];
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'open';
  question: string;
  options?: string[];
}

export interface QuizEvaluation {
  score: number;
  feedback: string;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FlashCard {
  front: string;
  back: string;
}

export interface NextTopicResponse {
  topic_slug: string;
  topic_name: string;
  reason?: string;
}

export interface FlagResponse {
  alternative_explanation: string;
}

export interface HintResponse {
  hint: string;
}

export const TOPICS: { slug: string; name: string; icon: string; description: string }[] = [
  { slug: 'ml-fundamentals', name: 'ML Fundamentals', icon: '🤖', description: 'Core concepts of machine learning' },
  { slug: 'neural-networks', name: 'Neural Networks', icon: '🧠', description: 'How artificial neurons learn' },
  { slug: 'deep-learning', name: 'Deep Learning', icon: '⚡', description: 'Multi-layer neural architectures' },
  { slug: 'nlp-basics', name: 'NLP Basics', icon: '💬', description: 'Natural language processing fundamentals' },
  { slug: 'transformers', name: 'Transformers & Attention', icon: '🔄', description: 'Attention mechanisms and transformers' },
  { slug: 'computer-vision', name: 'Computer Vision', icon: '👁️', description: 'Teaching machines to see' },
  { slug: 'reinforcement-learning', name: 'Reinforcement Learning', icon: '🎮', description: 'Learning through reward and punishment' },
  { slug: 'prompt-engineering', name: 'Prompt Engineering', icon: '✍️', description: 'Crafting effective AI prompts' },
  { slug: 'llm-architecture', name: 'LLM Architecture', icon: '🏗️', description: 'How large language models work' },
  { slug: 'ai-ethics', name: 'AI Ethics', icon: '⚖️', description: 'Responsible AI development' },
];
