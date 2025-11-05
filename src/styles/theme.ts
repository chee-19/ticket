export const buttonBase =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-app disabled:opacity-50 disabled:cursor-not-allowed';

export const buttonPrimary =
  `${buttonBase} text-app bg-gradient-to-r from-accent to-accent-strong hover:from-accent-strong hover:to-accent`;

export const buttonGhost =
  `${buttonBase} text-secondary hover:text-primary bg-white/5 hover:bg-white/10`;

export const buttonDanger =
  `${buttonBase} text-danger bg-danger/20 hover:bg-danger/30`;

export const badgeBase = 'px-2.5 py-1 rounded-full text-xs font-medium';

export const statusBadge = (status: string) => {
  switch (status) {
    case 'Open':
      return `${badgeBase} bg-accent/15 text-accent`;
    case 'In Progress':
      return `${badgeBase} bg-accent-teal/15 text-accent-teal`;
    case 'Resolved':
    case 'Closed':
      return `${badgeBase} bg-success/15 text-success`;
    case 'SLA Breached':
      return `${badgeBase} bg-danger/15 text-danger`;
    default:
      return `${badgeBase} bg-white/5 text-secondary`;
  }
};

export const urgencyBadge = (urgency: string) => {
  switch (urgency) {
    case 'High':
      return `${badgeBase} bg-danger/15 text-danger`;
    case 'Medium':
      return `${badgeBase} bg-warning/15 text-warning`;
    case 'Low':
      return `${badgeBase} bg-success/15 text-success`;
    default:
      return `${badgeBase} bg-white/5 text-secondary`;
  }
};
