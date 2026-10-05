export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // text or base64 data URL
  isBase64?: boolean;
  enabled: boolean;
  preview?: string;
  lastModified?: number;
}

export interface AssertionRule {
  id: string;
  type: 'contains' | 'not_contains' | 'is_json' | 'max_latency' | 'regex' | 'min_length';
  value: string;
  enabled: boolean;
  description?: string;
}

export interface AssertionResult {
  ruleId: string;
  type: string;
  expected: string;
  passed: boolean;
  message: string;
}

export interface TestResult {
  id: string;
  runNumber: number;
  testerId: string;
  testerName: string;
  systemPromptSnapshot: string;
  humanPromptSnapshot: string;
  filesSnapshot: { name: string; size: number; type: string }[];
  model: string;
  temperature: number;
  topP: number;
  responseFormat: 'text' | 'json';
  output: string;
  durationMs: number;
  finishReason?: string;
  usage: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
  timestamp: string;
  status: 'success' | 'error' | 'running';
  error?: string;
  rating?: 'up' | 'down' | null;
  notes?: string;
  assertionResults?: AssertionResult[];
}

export interface PromptTester {
  id: string;
  name: string;
  description: string;
  category?: string;
  systemPrompt: string;
  humanPrompt: string;
  inputFiles: AttachedFile[];
  model: string;
  temperature: number;
  topP: number;
  responseFormat: 'text' | 'json';
  thinkingLevel: 'MINIMAL' | 'LOW' | 'HIGH' | 'AUTO';
  variables: Record<string, string>;
  assertions: AssertionRule[];
  createdAt: string;
  updatedAt: string;
}
