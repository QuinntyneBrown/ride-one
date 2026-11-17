// The nouns and titles that name the chosen machine in the UI (L2-071 criteria 11 and 14).
import type { Machine } from '@wattzup/api';

export interface MachineWords {
  /** `bike` or `treadmill`, inside a sentence. */
  noun: string;
  /** `Echelon bike` or `Echelon treadmill`. */
  title: string;
  /** `Bike` or `Treadmill`, at the start of a label. */
  label: string;
  /** The command log's title. */
  panelTitle: string;
}

const WORDS: Record<Machine, MachineWords> = {
  bike: { noun: 'bike', title: 'Echelon bike', label: 'Bike', panelTitle: 'Sent to bike' },
  treadmill: {
    noun: 'treadmill',
    title: 'Echelon treadmill',
    label: 'Treadmill',
    panelTitle: 'Sent to treadmill',
  },
};

export function machineWords(machine: Machine | null | undefined): MachineWords {
  return WORDS[machine ?? 'bike'];
}

/** The setup screen's lead sentence (L2-072). */
export function setupLead(machine: Machine): string {
  return machine === 'treadmill'
    ? "Wattzup drives the Stride's belt speed and incline for you. Pick how."
    : "Wattzup drives the bike's resistance for you. Pick how.";
}
