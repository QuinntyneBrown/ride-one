import { machineWords, setupLead } from './machine-words';

describe('machineWords (L2-071)', () => {
  it.each([
    ['bike', 'bike', 'Echelon bike', 'Bike', 'Sent to bike'],
    ['treadmill', 'treadmill', 'Echelon treadmill', 'Treadmill', 'Sent to treadmill'],
  ] as const)('words the %s', (machine, noun, title, label, panelTitle) => {
    expect(machineWords(machine)).toEqual({ noun, title, label, panelTitle });
  });

  it('words the bike before the state arrives', () => {
    expect(machineWords(null).noun).toBe('bike');
  });

  it('leads the setup screen with the machine', () => {
    expect(setupLead('bike')).toBe("Wattzup drives the bike's resistance for you. Pick how.");
    expect(setupLead('treadmill')).toBe(
      "Wattzup drives the Stride's belt speed and incline for you. Pick how.",
    );
  });
});
