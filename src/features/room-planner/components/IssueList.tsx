import type { FengShuiIssue, IssueSeverity } from '../feng-shui/types';

const SEVERITY_DOT: Record<IssueSeverity, string> = {
  error:   '●',
  warning: '●',
  info:    '●',
};

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  error:   'Error',
  warning: 'Warning',
  info:    'Info',
};

interface IssueListProps {
  issues: FengShuiIssue[];
  onSelectItem: (id: number) => void;
}

export function IssueList({ issues, onSelectItem }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="feng-shui-results-empty" role="status">
        <span>No issues found — good feng shui!</span>
      </div>
    );
  }

  return (
    <ul className="issue-list" role="list">
      {issues.map((issue, i) => (
        <li
          key={`${issue.ruleId}-${issue.affectedItemId ?? 'room'}-${i}`}
          className={`issue-item issue-item--${issue.severity}`}
          onClick={() => issue.affectedItemId !== null && onSelectItem(issue.affectedItemId)}
          style={{ cursor: issue.affectedItemId !== null ? 'pointer' : 'default' }}
        >
          <div className="issue-header">
            <span className={`issue-dot issue-dot--${issue.severity}`} aria-hidden="true">
              {SEVERITY_DOT[issue.severity]}
            </span>
            <span className="issue-severity">{SEVERITY_LABEL[issue.severity]}</span>
            <span className="issue-title">{issue.title}</span>
          </div>
          <p className="issue-description">{issue.description}</p>
          <p className="issue-suggestion">{issue.suggestion}</p>
        </li>
      ))}
    </ul>
  );
}
