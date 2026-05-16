export type IssueSeverity = 'error' | 'warning' | 'info';

export interface FengShuiIssue {
  ruleId: string;
  severity: IssueSeverity;
  affectedItemId: number | null;
  title: string;
  description: string;
  suggestion: string;
}

export interface FengShuiResult {
  issues: FengShuiIssue[];
  analyzedAt: number;
}
