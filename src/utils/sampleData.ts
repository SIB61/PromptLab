import { PromptTester, AttachedFile } from '../types/prompt';

export const SAMPLE_FILES: AttachedFile[] = [
  {
    id: 'sample-file-1',
    name: 'customer_support_ticket_#8941.txt',
    size: 942,
    type: 'text/plain',
    content: `Ticket ID: #8941
Submitted: 2026-10-04 14:22:10 UTC
Customer: Sarah Jenkins (Tier: Enterprise / Fortune 500)
Subject: CRITICAL: Billing double-charge and API webhooks dropping silently

Message:
Hi Support Team,
We noticed this morning that our production webhooks stopped receiving event callbacks after your maintenance window yesterday at 23:00 UTC. We have lost over 450 customer checkout events, impacting approximately $35,000 in transaction logging.
On top of this, our corporate card was charged twice ($4,999.00 x 2) for invoice #INV-88219. 
We need this escalated to your Level 3 Infrastructure and Billing team immediately. If this is not resolved within 2 hours, we will be forced to halt our enterprise migration plan.

Best regards,
Sarah Jenkins
VP of Engineering, Acme FinTech`,
    enabled: true,
  },
  {
    id: 'sample-file-2',
    name: 'q3_sales_performance.csv',
    size: 780,
    type: 'text/csv',
    content: `Region,Quarter,Product_Tier,Target_ARR,Actual_ARR,Churn_Rate,Customer_Count
North_America,Q3_2026,Enterprise,1200000,1450000,0.018,48
North_America,Q3_2026,Mid_Market,800000,740000,0.035,112
North_America,Q3_2026,Starter,350000,410000,0.052,380
EMEA,Q3_2026,Enterprise,950000,980000,0.021,34
EMEA,Q3_2026,Mid_Market,600000,520000,0.048,85
EMEA,Q3_2026,Starter,250000,290000,0.061,290
APAC,Q3_2026,Enterprise,700000,890000,0.012,28
APAC,Q3_2026,Mid_Market,500000,480000,0.039,72
APAC,Q3_2026,Starter,200000,240000,0.045,210`,
    enabled: true,
  },
  {
    id: 'sample-file-3',
    name: 'payment_handler.ts',
    size: 1120,
    type: 'text/typescript',
    content: `import { Request, Response } from 'express';
import db from './database';

export async function processRefund(req: Request, res: Response) {
  const { transactionId, amount, reason } = req.body;
  
  // Potential flaw: no authentication check verifying if user owns transaction
  // Raw SQL query interpolation
  const query = \`SELECT * FROM transactions WHERE id = '\${transactionId}'\`;
  const [txn] = await db.raw(query);

  if (!txn) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Flaw: floating point calculation directly without rounding or currency math
  const newBalance = txn.amount - amount;

  await db.raw(\`UPDATE transactions SET refunded = true, balance = \${newBalance} WHERE id = '\${transactionId}'\`);

  // Flaw: logging sensitive data unmasked
  console.log('Processed refund for credit card:', txn.card_number, 'amount:', amount);

  return res.json({ success: true, newBalance });
}`,
    enabled: true,
  },
  {
    id: 'sample-file-4',
    name: 'legal_sla_agreement.md',
    size: 1450,
    type: 'text/markdown',
    content: `# Enterprise SLA & Indemnification Agreement Excerpt

## Section 8: Uptime Guarantees and Credits
8.1 Provider warrants 99.95% monthly uptime. If uptime drops below 99.90%, Customer is eligible for a 10% credit. If uptime drops below 99.00%, Customer is eligible for a 25% credit.
8.2 Scheduled maintenance must be announced at least 72 hours in advance and shall not exceed 4 hours per calendar month.

## Section 11: Limitation of Liability
11.1 Except for breaches of Section 14 (Confidentiality) or gross negligence, neither party's aggregate liability shall exceed the total fees paid by Customer in the preceding twelve (12) months.
11.2 In no event shall either party be liable for indirect, punitive, or consequential damages.

## Section 14: Data Protection & Breach Notification
14.1 Provider shall notify Customer in writing within 24 hours of becoming aware of any confirmed security incident compromising Customer data.`,
    enabled: true,
  },
];

export const INITIAL_TESTERS: PromptTester[] = [
  {
    id: 'tester-support-classifier',
    name: 'Customer Support Intent & Urgency Classifier',
    description: 'Stateless classification prompt converting unstructured customer tickets into structured JSON with SLA tier and action plan.',
    category: 'Classification & JSON',
    systemPrompt: `You are an automated tier-1 triage agent for a high-volume SaaS platform.
Your task is to analyze incoming support tickets and any attached policy/error logs, then produce a strictly valid JSON response.

Instructions:
1. Determine the "intent" (e.g., BILLING_DISPUTE, TECHNICAL_OUTAGE, FEATURE_REQUEST, ACCOUNT_ACCESS).
2. Assign an "urgency" level: P1 (Critical Outage/Financial impact), P2 (Major feature degraded), P3 (Minor defect), P4 (General query).
3. Identify customer sentiment (NEGATIVE, NEUTRAL, POSITIVE).
4. Summarize the core grievance in 1 sentence.
5. Provide 3 specific immediate action steps for the assigned team.

Output Format: Strictly output valid JSON matching this schema:
{
  "ticket_id": string,
  "intent": string,
  "urgency": "P1" | "P2" | "P3" | "P4",
  "sentiment": string,
  "summary": string,
  "financial_impact": boolean,
  "affected_services": string[],
  "recommended_routing": string,
  "action_items": string[]
}`,
    humanPrompt: `Please analyze the attached customer support ticket and classify it according to our SLA policies. Make sure to flag any financial or SLA breach risk.`,
    inputFiles: [SAMPLE_FILES[0]],
    model: 'gemini-3.1-flash-lite',
    temperature: 0.2,
    topP: 0.95,
    responseFormat: 'json',
    thinkingLevel: 'LOW',
    variables: {
      team: 'Enterprise L3 Support',
      escalation_time: '2 hours',
    },
    assertions: [
      {
        id: 'rule-json',
        type: 'is_json',
        value: '',
        enabled: true,
        description: 'Output must be valid parseable JSON',
      },
      {
        id: 'rule-contains-p1',
        type: 'contains',
        value: '"urgency": "P1"',
        enabled: true,
        description: 'Must correctly classify urgent ticket as P1',
      },
      {
        id: 'rule-latency',
        type: 'max_latency',
        value: '3000',
        enabled: true,
        description: 'Response time under 3000ms',
      },
    ],
    createdAt: '2026-10-04T12:00:00.000Z',
    updatedAt: '2026-10-04T12:00:00.000Z',
  },
  {
    id: 'tester-code-auditor',
    name: 'Application Security & Vulnerability Reviewer',
    description: 'Test prompts for reviewing code snippets, pinpointing vulnerabilities (CWE/OWASP), and generating hardened replacement code.',
    category: 'Engineering & Security',
    systemPrompt: `You are a Principal Application Security Architect.
You will receive source code files and review instructions from engineering teams.

Your objective:
1. Conduct a rigorous security code review.
2. Identify security vulnerabilities with CWE or OWASP categorization.
3. Highlight subtle edge cases (race conditions, unvalidated inputs, data leakages).
4. Provide a secure, production-ready refactored version of the code with explanatory comments.
5. Use clear Markdown sections with severity tags: [HIGH], [MEDIUM], [LOW].`,
    humanPrompt: `Review the attached payment handler code. Identify all security flaws, explain why they pose a risk in a payment processing pipeline, and provide the fully refactored secure version in TypeScript.`,
    inputFiles: [SAMPLE_FILES[2]],
    model: 'gemini-3.1-flash-lite',
    temperature: 0.3,
    topP: 0.95,
    responseFormat: 'text',
    thinkingLevel: 'HIGH',
    variables: {
      framework: 'Express + PostgreSQL',
    },
    assertions: [
      {
        id: 'rule-contains-sql',
        type: 'contains',
        value: 'SQL',
        enabled: true,
        description: 'Must identify SQL injection vulnerability',
      },
      {
        id: 'rule-min-length',
        type: 'min_length',
        value: '200',
        enabled: true,
        description: 'Comprehensive code review (>200 characters)',
      },
    ],
    createdAt: '2026-10-04T14:30:00.000Z',
    updatedAt: '2026-10-04T14:30:00.000Z',
  },
  {
    id: 'tester-csv-analyst',
    name: 'Executive Sales & Data Insight Analyst',
    description: 'Test prompt that digests tabular CSV data and synthesizes executive bullet points, anomalies, and ROI growth recommendations.',
    category: 'Data Analysis',
    systemPrompt: `You are an elite FP&A and Revenue Operations Analyst.
Analyze the provided tabular data files and deliver sharp, executive-ready synthesis.

Rules:
- Never guess numbers; calculate strictly from the attached data.
- Structure your response into:
  1. Key Performance Highlights (Bullet points with actual vs target ARR delta)
  2. Underperforming segments / Anomaly detection (Churn rates, quotas missed)
  3. Strategic Recommendations for Q4.
- Use clean Markdown tables or formatted lists.`,
    humanPrompt: `Review our attached Q3 sales numbers CSV. Which region exceeded target ARR the most? Where did we see concerning churn rates, and what actions should the CRO take?`,
    inputFiles: [SAMPLE_FILES[1]],
    model: 'gemini-3.1-flash-lite',
    temperature: 0.4,
    topP: 0.95,
    responseFormat: 'text',
    thinkingLevel: 'LOW',
    variables: {},
    assertions: [
      {
        id: 'rule-contains-na',
        type: 'contains',
        value: 'North America',
        enabled: true,
        description: 'Mentions North America performance',
      },
      {
        id: 'rule-latency',
        type: 'max_latency',
        value: '3500',
        enabled: true,
        description: 'Execution finishes under 3.5s',
      },
    ],
    createdAt: '2026-10-04T16:00:00.000Z',
    updatedAt: '2026-10-04T16:00:00.000Z',
  },
];
