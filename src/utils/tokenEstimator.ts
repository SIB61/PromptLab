export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Common heuristic for Gemini/LLM tokenizer: ~4 characters per token in English
  return Math.ceil(text.length / 4);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function substituteVariables(text: string, variables: Record<string, string>): string {
  if (!text) return '';
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

export function extractVariables(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g) || [];
  const vars = new Set<string>();
  for (const match of matches) {
    const cleaned = match.replace(/[{}]/g, '').trim();
    if (cleaned) vars.add(cleaned);
  }
  return Array.from(vars);
}
