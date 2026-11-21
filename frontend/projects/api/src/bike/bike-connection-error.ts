/** Why the bike could not be chosen or reached; a screen branches on `code`, the rider reads plain words. */
export type BikeConnectionErrorCode = 'blocked' | 'failed';

/** A refusal from `BikeConnection` (L2-012 AC4): `blocked` when a policy keeps the chooser shut. */
export class BikeConnectionError extends Error {
  constructor(
    readonly code: BikeConnectionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BikeConnectionError';
  }
}
