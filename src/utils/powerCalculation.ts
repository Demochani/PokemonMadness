export const STEPS_PER_POWER_LEVEL = 100;

export const calculatePowerLevelFromSteps = (steps: number): number => {
  return Math.floor(steps / STEPS_PER_POWER_LEVEL);
};

