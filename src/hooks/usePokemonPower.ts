import { useEffect, useState, useCallback, useRef } from 'react';
import { Pokemon } from '../types/pokemon';
import { storageService } from '../services/storage';
import { useStepTracking, calculatePowerLevelFromSteps } from './useStepTracking';

interface UsePokemonPowerResult {
  powerLevel: number;
  stepsFromPower: number;
  totalSteps: number;
  isLoading: boolean;
  isTracking: boolean;
  hasPermission: boolean;
  canAskAgain: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  openSettings: () => Promise<void>;
  refreshPower: () => Promise<void>;
}

export const usePokemonPower = (pokemon: Pokemon | null): UsePokemonPowerResult => {
  const [basePowerLevel, setBasePowerLevel] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [storedSteps, setStoredSteps] = useState<number>(0);
  const {
    steps,
    isAvailable,
    isTracking,
    hasPermission,
    canAskAgain,
    error,
    startTracking,
    requestPermission,
    openSettings,
  } = useStepTracking(false);
  const trackingStartedRef = useRef<number | null>(null);

  const loadPowerLevel = useCallback(async () => {
    if (!pokemon) {
      setIsLoading(false);
      return;
    }

    try {
      const storedPower = await storageService.getPowerLevel(pokemon.id);
      const storedStepProgress = await storageService.getStepProgress(pokemon.id);
      setBasePowerLevel(storedPower);
      setStoredSteps(storedStepProgress);
    } catch (error) {
      console.error('Error loading power level:', error);
      setBasePowerLevel(0);
      setStoredSteps(0);
    } finally {
      setIsLoading(false);
    }
  }, [pokemon]);

  useEffect(() => {
    loadPowerLevel();
  }, [loadPowerLevel]);

  useEffect(() => {
    if (
      pokemon &&
      !isTracking &&
      isAvailable &&
      hasPermission &&
      trackingStartedRef.current !== pokemon.id
    ) {
      console.log('🎮 Pokemon loaded:', pokemon.name);
      console.log(
        '🔍 Step tracker status - Available:',
        isAvailable,
        'Tracking:',
        isTracking,
        'Permission:',
        hasPermission,
      );
      
      trackingStartedRef.current = pokemon.id;

      console.log('🚀 Attempting to start step tracking...');
      startTracking().catch((err) => {
        console.error('❌ Failed to start step tracking:', err);
        trackingStartedRef.current = null;
      });
    }
    
    if (pokemon && trackingStartedRef.current !== null && trackingStartedRef.current !== pokemon.id) {
      trackingStartedRef.current = null;
    }
  }, [pokemon?.id, isTracking, isAvailable, hasPermission]);

  const totalSteps = storedSteps + steps;
  const stepsFromPower = calculatePowerLevelFromSteps(totalSteps);
  const totalPowerLevel = basePowerLevel + stepsFromPower;

  useEffect(() => {
    if (!pokemon) return;
    storageService.saveStepProgress(pokemon.id, totalSteps);
  }, [pokemon?.id, totalSteps]);

  const refreshPower = useCallback(async () => {
    if (!pokemon) return;
    
    await storageService.savePowerLevel(pokemon.id, totalPowerLevel);
    await storageService.saveStepProgress(pokemon.id, totalSteps);
  }, [pokemon, totalPowerLevel, totalSteps]);

  return {
    powerLevel: totalPowerLevel,
    stepsFromPower,
    totalSteps,
    isLoading,
    isTracking,
    hasPermission,
    canAskAgain,
    error,
    requestPermission,
    openSettings,
    refreshPower,
  };
};

