import { calculatePowerLevelFromSteps } from '../powerCalculation';

describe('Power Level Calculation', () => {
  it('should return 0 for 0 steps', () => {
    expect(calculatePowerLevelFromSteps(0)).toBe(0);
  });

  it('should return 1 for 100 steps', () => {
    expect(calculatePowerLevelFromSteps(100)).toBe(1);
  });

  it('should return 1 for 199 steps', () => {
    expect(calculatePowerLevelFromSteps(199)).toBe(1);
  });

  it('should return 2 for 200 steps', () => {
    expect(calculatePowerLevelFromSteps(200)).toBe(2);
  });

  it('should return 5 for 500 steps', () => {
    expect(calculatePowerLevelFromSteps(500)).toBe(5);
  });

  it('should return 10 for 1000 steps', () => {
    expect(calculatePowerLevelFromSteps(1000)).toBe(10);
  });

  it('should handle large step counts', () => {
    expect(calculatePowerLevelFromSteps(10000)).toBe(100);
  });
});

