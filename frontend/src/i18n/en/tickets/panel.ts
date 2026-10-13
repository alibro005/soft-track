/** Ticket panel: the slide-over's header, its ⋯ menu, the title, Files and the "Created by" line. */
export const panel = {
  // The dialog's name while the ticket is still loading.
  loading: 'Ticket',
  importedKey: "This ticket's key before it was imported",
  closeHint: 'Close (Esc)',
  // The way out of the panel to the ticket's own page (#112), beside Close.
  openAsPage: 'Open as page',
  // A ticket the board's filters exclude, opened anyway (#115): why its card
  // is not on the board, and the way to put it there.
  hiddenByFilters: 'Not on the board right now: your filters hide it.',
  clearFilters: 'Clear filters',
  // A number with nothing behind it (#115), under the ticket page's own words.
  backToBoard: 'Back to the board',
  title: 'Title',
  files: 'Files',
  // The properties' own landmark: a column beside the reading on a wide page (#112).
  details: 'Details',
  createdBy: 'Created by <person>{{name}}</person> {{when}}',
  actions: {
    more: 'More actions',
    menu: 'Ticket actions',
    moveToTeam: 'Move to another team…',
    delete: 'Delete ticket…',
  },
  // Deleting moves the ticket to the team's trash (#323), where it keeps
  // everything it has until it is restored or purged -- in the bulk bar's
  // words. A line with nothing to count is left out.
  delete: {
    title: 'Delete {{identifier}}?',
    trash:
      'It moves to the team’s trash with its history, and leaves boards, lists, search and reports. It can be restored from the trash, as it was, until it is purged.',
    comments_one: 'Its comment goes with it.',
    comments_other: 'Its {{count}} comments go with it.',
    attachments_one: 'Its attachment goes with it, file and all.',
    attachments_other: 'Its {{count}} attachments go with it, files and all.',
    links_one: 'Its link to another ticket goes with it.',
    links_other: 'Its {{count}} links to other tickets go with it.',
    subTickets_one: 'Its sub-ticket stays on the board.',
    subTickets_other: 'Its {{count}} sub-tickets stay on the board.',
    cancel: 'Cancel',
    confirm: 'Delete ticket',
    deleting: 'Deleting…',
    failed: 'Could not delete this ticket.',
    // The toast once it has gone.
    success: '{{identifier}} moved to the trash.',
    successSubTickets_one: '{{identifier}} moved to the trash. Its sub-ticket stays on the board.',
    successSubTickets_other:
      '{{identifier}} moved to the trash. Its {{count}} sub-tickets stay on the board.',
  },
} as const
