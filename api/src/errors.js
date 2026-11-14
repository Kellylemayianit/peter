// Errors whose message is safe and friendly enough to show to the person using Becca.
export class UserError extends Error {}
export class NotConnected extends UserError {
  constructor(app, why = '') {
    super(`${app === 'google' ? 'Google' : 'Trello'} ${why === 'expired' ? 'needs you to sign in again' : 'is not connected yet'}. Open Apps to fix it.`);
    this.app = app;
  }
}
export const friendly = (e) => (e instanceof UserError ? e.message : 'Something went wrong on my side. Please try again.');
