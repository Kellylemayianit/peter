// Seed data. Replace these with fetch() calls to your backend later;
// every view reads from the store, so only this file and main.js's initial state change.
import { nextWeekday } from '../core/format.js';

export const fixtures = [
  {
    id: 'ars-che', league: 'Premier League', home: 'Arsenal', away: 'Chelsea',
    kickoff: nextWeekday(6, 17, 30), verified: true, lineups: false,
    probs: { home: 69, draw: 18, away: 13 },
    markets: [
      { name: 'Over 2.5 goals', value: '61%' },
      { name: 'Both teams score', value: '52%' },
      { name: 'Arsenal or draw', value: '87%' },
    ],
  },
  {
    id: 'rma-bar', league: 'La Liga', home: 'Real Madrid', away: 'Barcelona',
    kickoff: nextWeekday(0, 22, 0), verified: true, lineups: false,
    probs: { home: 50, draw: 21, away: 29 }, markets: [],
  },
  {
    id: 'liv-mci', league: 'Premier League', home: 'Liverpool', away: 'Man City',
    kickoff: nextWeekday(0, 17, 30), verified: false,
    note: 'Not confirmed in the fixture feed. Prediction withheld until it is.',
  },
];

export const initialState = {
  theme: 'dark',
  accent: '#F5A524',
  predictionLocked: false,

  approvals: [
    { id: 'a1', title: 'Add Arsenal vs Chelsea to Predictions 2026',
      detail: 'Predictions 2026 → row 14: Arsenal vs Chelsea | Arsenal win | 69% | pending', status: 'pending' },
    { id: 'a2', title: 'Update the decision log',
      detail: 'Decisions → row 9: Pivot to online wholesale | status: validating', status: 'pending' },
  ],

  decisions: [
    { id: 'd1', title: 'Pivot to online wholesale', next: 'Next: validate with five supplier calls.', pct: 72, risk: 'Medium risk', tone: 'accent', needsOutcome: true, ageDays: 9 },
    { id: 'd2', title: 'Quit consulting for product', next: 'Next: set a runway number first.', pct: 54, risk: 'High risk', tone: 'bad' },
    { id: 'd3', title: 'Hire a part-time analyst', next: 'Next: compare two quotes.', pct: 83, risk: 'Low risk', tone: 'good' },
    { id: 'd4', title: 'Switch accounting software', next: 'Next: trial it for two weeks.', pct: 65, risk: 'Medium risk', tone: 'accent' },
  ],

  memories: [
    { id: 'm1', text: 'You want predictions withheld until a fixture is verified.', status: 'proposed' },
    { id: 'm2', text: 'You log decision outcomes within a week.', status: 'proposed' },
    { id: 'm3', text: 'You approve Sheets writes before they happen.', status: 'proposed' },
    { id: 'm4', text: 'You prefer direct, evidence-first answers.', status: 'saved' },
    { id: 'm5', text: 'Never commit irreversible resources to an unvalidated idea.', status: 'saved' },
  ],

  messages: [], // filled by the assistant view on first visit
};

export const staticHome = {
  prompts: [
    'Predict this weekend’s fixtures',
    'Review my open decisions',
    'Draft the pending replies',
    'What did I decide last week?',
  ],
  sparks: ['0,24 14,20 28,22 42,14 56,16 70,8 84,10', '0,10 14,12 28,8 42,16 56,14 70,20 84,18', '0,26 14,24 28,24 42,18 56,20 70,12 84,6', '0,8 14,14 28,10 42,18 56,16 70,22 84,20'],
  today: [
    { time: '11:00', title: 'Review pivot decision', color: 'var(--info)' },
    { time: '14:30', title: 'Send three drafted replies', color: 'var(--accent)' },
    { time: '17:30', title: 'Arsenal vs Chelsea kickoff', color: 'var(--good)' },
  ],
  systems: [
    { name: 'Gemini reasoning', state: 'Connected', color: 'var(--good)' },
    { name: 'Football data', state: 'Connected', color: 'var(--good)' },
    { name: 'Memory sync', state: 'Synced', color: 'var(--good)' },
    { name: 'Google Workspace', state: 'Sign in to enable', color: 'var(--warn)' },
    { name: 'Broker feed', state: 'Read only, demo', color: 'var(--info)' },
  ],
};

export const nav = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'assistant', label: 'Assistant', icon: 'chat' },
  { id: 'football', label: 'Football', icon: 'ball' },
  { id: 'decisions', label: 'Decisions', icon: 'scale' },
  { id: 'memory', label: 'Memory', icon: 'layers' },
  { id: 'workspace', label: 'Workspace', icon: 'grid' },
];
