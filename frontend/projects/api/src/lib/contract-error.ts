// How a contract call refuses: a stable code a screen can branch on and, for a plan that is not
// valid, the messages for each field.
export type ContractErrorCode =
  | 'invalid_level'
  | 'bike_not_connected'
  | 'send_failed'
  | 'already_connected'
  | 'invalid_workout'
  | 'no_active_workout';

export class ContractError extends Error {
  constructor(
    readonly code: ContractErrorCode,
    message: string,
    readonly errors: Readonly<Record<string, readonly string[]>> = {},
  ) {
    super(message);
    this.name = 'ContractError';
  }
}

/** True when `e` is a ContractError with this code. */
export function isContractError(e: unknown, code: ContractErrorCode): e is ContractError {
  return e instanceof ContractError && e.code === code;
}
