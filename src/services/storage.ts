import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  POWER_LEVELS: '@pokemon_power_levels',
  STEP_PROGRESS: '@pokemon_step_progress',
} as const;

type PokemonValueMap = Record<number, number>;

class StorageService {
  async getPowerLevels(): Promise<PokemonValueMap> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.POWER_LEVELS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading power levels:', error);
      return {};
    }
  }

  async savePowerLevel(pokemonId: number, powerLevel: number): Promise<void> {
    try {
      const powerLevels = await this.getPowerLevels();
      powerLevels[pokemonId] = powerLevel;
      await AsyncStorage.setItem(STORAGE_KEYS.POWER_LEVELS, JSON.stringify(powerLevels));
    } catch (error) {
      console.error('Error saving power level:', error);
    }
  }

  async getPowerLevel(pokemonId: number): Promise<number> {
    const powerLevels = await this.getPowerLevels();
    return powerLevels[pokemonId] || 0;
  }

  async getStepProgressMap(): Promise<PokemonValueMap> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STEP_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading step progress:', error);
      return {};
    }
  }

  async getStepProgress(pokemonId: number): Promise<number> {
    const progress = await this.getStepProgressMap();
    return progress[pokemonId] || 0;
  }

  async saveStepProgress(pokemonId: number, steps: number): Promise<void> {
    try {
      const progress = await this.getStepProgressMap();
      if (steps <= 0) {
        delete progress[pokemonId];
      } else {
        progress[pokemonId] = steps;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.STEP_PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving step progress:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.POWER_LEVELS);
      await AsyncStorage.removeItem(STORAGE_KEYS.STEP_PROGRESS);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const storageService = new StorageService();

