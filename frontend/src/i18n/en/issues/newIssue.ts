/** The new-issue form. */
export const newIssue = {
  title: 'New issue',
  replaceDescription:
    'Replace the description you have written with the “{{name}}” template?',
  template: 'Template',
  noTemplate: 'No template',
  issueTitle: 'Issue title',
  descriptionPlaceholder: 'Add a description… Markdown works here.',
  status: 'Status',
  type: 'Type',
  priority: 'Priority',
  estimate: 'Estimate',
  noEstimate: 'No estimate',
  cycle: 'Cycle',
  // The cycle picker's empty choice: not in any cycle.
  noCycle: 'Backlog',
  dueDate: 'Due date',
  project: 'Project',
  noProject: 'No project',
  assignee: 'Assignee',
  unassigned: 'Unassigned',
  similarIssue_one: '{{count}} similar issue found.',
  similarIssue_other: '{{count}} similar issues found.',
  possiblySimilar: 'Possibly similar',
  dismissSimilar: 'Dismiss similar issues',
  similarIssues: 'Similar issues',
  create: 'Create issue',
  creating: 'Creating…',
  errors: {
    create: 'Could not create the issue. Please try again.',
  },
} as const
