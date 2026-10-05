import { AssertionRule, AssertionResult } from '../types/prompt';

export function runAssertions(
  output: string,
  durationMs: number,
  rules: AssertionRule[]
): AssertionResult[] {
  const results: AssertionResult[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    switch (rule.type) {
      case 'contains': {
        const passed = output.toLowerCase().includes(rule.value.toLowerCase());
        results.push({
          ruleId: rule.id,
          type: 'contains',
          expected: `Must contain "${rule.value}"`,
          passed,
          message: passed
            ? `Passed: Output contains "${rule.value}"`
            : `Failed: Output does not contain "${rule.value}"`,
        });
        break;
      }

      case 'not_contains': {
        const passed = !output.toLowerCase().includes(rule.value.toLowerCase());
        results.push({
          ruleId: rule.id,
          type: 'not_contains',
          expected: `Must not contain "${rule.value}"`,
          passed,
          message: passed
            ? `Passed: Output excludes "${rule.value}"`
            : `Failed: Output unexpectedly contains "${rule.value}"`,
        });
        break;
      }

      case 'is_json': {
        let passed = false;
        try {
          // Remove potential markdown code fences ```json ... ```
          let clean = output.trim();
          if (clean.startsWith('```json')) {
            clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (clean.startsWith('```')) {
            clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          JSON.parse(clean);
          passed = true;
        } catch {
          passed = false;
        }
        results.push({
          ruleId: rule.id,
          type: 'is_json',
          expected: 'Valid JSON output',
          passed,
          message: passed ? 'Passed: Output parses as valid JSON' : 'Failed: Output is not valid JSON',
        });
        break;
      }

      case 'max_latency': {
        const maxLimit = parseInt(rule.value, 10) || 5000;
        const passed = durationMs <= maxLimit;
        results.push({
          ruleId: rule.id,
          type: 'max_latency',
          expected: `Latency ≤ ${maxLimit}ms`,
          passed,
          message: passed
            ? `Passed: Completed in ${durationMs}ms (threshold: ${maxLimit}ms)`
            : `Failed: Completed in ${durationMs}ms (exceeded threshold: ${maxLimit}ms)`,
        });
        break;
      }

      case 'min_length': {
        const minLen = parseInt(rule.value, 10) || 10;
        const passed = output.length >= minLen;
        results.push({
          ruleId: rule.id,
          type: 'min_length',
          expected: `Length ≥ ${minLen} characters`,
          passed,
          message: passed
            ? `Passed: Output length is ${output.length} characters`
            : `Failed: Output length is ${output.length} (minimum: ${minLen})`,
        });
        break;
      }

      case 'regex': {
        let passed = false;
        try {
          const reg = new RegExp(rule.value, 'i');
          passed = reg.test(output);
        } catch {
          passed = false;
        }
        results.push({
          ruleId: rule.id,
          type: 'regex',
          expected: `Matches regex /${rule.value}/`,
          passed,
          message: passed
            ? `Passed: Output matched pattern /${rule.value}/`
            : `Failed: Output did not match regex /${rule.value}/`,
        });
        break;
      }
    }
  }

  return results;
}
