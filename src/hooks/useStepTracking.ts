import { useEffect, useState, useRef, useCallback } from 'react';
import { Linking, Platform, Alert } from 'react-native';
import { Pedometer } from 'expo-sensors';
import type { EventSubscription, PermissionResponse } from 'expo-modules-core';

interface StepTrackingResult {
  steps: number;
  isAvailable: boolean;
  isTracking: boolean;
  error: string | null;
  hasPermission: boolean;
  canAskAgain: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  openSettings: () => Promise<void>;
  resetSteps: () => void;
}

export const useStepTracking = (autoStart: boolean = false): StepTrackingResult => {
  const [rawSteps, setRawSteps] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [canAskAgain, setCanAskAgain] = useState<boolean>(true);
  const startDateRef = useRef<Date | null>(null);
  const subscriptionRef = useRef<EventSubscription | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const availabilityCheckedRef = useRef<boolean>(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const baselineRef = useRef<number>(0);

  const calculatedSteps = Math.max(rawSteps - baselineRef.current, 0);

  const parsePermission = (response: PermissionResponse | undefined): boolean => {
    if (!response) {
      return true;
    }
    if (typeof response.granted === 'boolean') {
      return response.granted;
    }
    if (typeof response.status === 'string') {
      return response.status === 'granted';
    }
    return true;
  };

  const updatePermissionState = useCallback((response: PermissionResponse | undefined) => {
    const granted = parsePermission(response);
    setHasPermission(granted);
    
    if (response && typeof response.canAskAgain === 'boolean') {
      setCanAskAgain(response.canAskAgain);
    }
    
    if (!granted) {
      if (response && response.canAskAgain === false) {
        setError('Permission denied. Please enable Motion & Fitness in Settings.');
      } else {
        setError('Pedometer permission not granted');
      }
    } else if (error && error.toLowerCase().includes('permission')) {
      setError(null);
    }
    return granted;
  }, [error]);

  const openSettings = useCallback(async () => {
     try {
       const canOpen = await Linking.canOpenURL('app-settings:');
       if (canOpen) {
         await Linking.openURL('app-settings:');
       } else {
         if (Linking.openSettings) {
           await Linking.openSettings();
         } else {
           throw new Error('Cannot open settings');
         }
       }
     } catch (err) {
       console.error('Error opening settings:', err);
       Alert.alert(
         'Unable to Open Settings',
         'Please manually enable Motion & Fitness permission in your device Settings.',
         [{ text: 'OK' }]
       );
     }
   }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof Pedometer.requestPermissionsAsync === 'function') {
        const response = await Pedometer.requestPermissionsAsync();
        console.log('🔍 Permission response:', response);
        const granted = updatePermissionState(response);
        
        if (!granted && response.canAskAgain === false) {
          Alert.alert(
            'Permission Required',
            'Motion & Fitness permission is required to track steps. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: openSettings },
            ]
          );
        }
        
        return granted;
      }
      setHasPermission(true);
      return true;
    } catch (err) {
      console.error('Error requesting pedometer permission:', err);
      setError('Unable to request pedometer permission');
      setHasPermission(false);
      return false;
    }
  }, [updatePermissionState, openSettings]);

  const checkPermissionStatus = useCallback(async () => {
    try {
      if (typeof Pedometer.getPermissionsAsync === 'function') {
        const response = await Pedometer.getPermissionsAsync();
        const granted = updatePermissionState(response);
        if (!granted && response.canAskAgain) {
          return requestPermission();
        }
        return granted;
      }
      setHasPermission(true);
      setCanAskAgain(true);
      return true;
    } catch (err) {
      console.warn('Permission check error:', err);
      setHasPermission(true);
      setCanAskAgain(true);
      return true;
    }
  }, [requestPermission, updatePermissionState]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (availabilityCheckedRef.current) return;

      try {
        console.log('🔍 Checking pedometer availability...');
        const available = await Pedometer.isAvailableAsync();
        console.log('🔍 Pedometer available:', available);
        setIsAvailable(available);
        availabilityCheckedRef.current = true;

        if (available) {
          await checkPermissionStatus();
        } else {
          setError('Pedometer is not available on this device');
        }
      } catch (err) {
        console.error('Error checking pedometer availability:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, [checkPermissionStatus]);

  const startTracking = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log('⚠️ Step tracking already started, skipping');
      return;
    }
    
    console.log('🔄 Starting step tracking with expo-sensors...');

    try {
      const available = await Pedometer.isAvailableAsync();
      setIsAvailable(available);
      console.log('🔍 Availability before starting:', available);

      if (!available) {
        setError('Pedometer is not available on this device');
        return;
      }

      let permissionGranted = hasPermission;
      if (!permissionGranted) {
        console.log('🔐 Requesting pedometer permission before starting tracking...');
        permissionGranted = await requestPermission();
      }

      if (!permissionGranted) {
        setError('Pedometer permission not granted');
        return;
      }

      const startDate = new Date();
      startDateRef.current = startDate;
      const subscription = Pedometer.watchStepCount((result) => {
        console.log('✅ Step update received:', result.steps);
        setRawSteps(result.steps);
      });
      subscriptionRef.current = subscription;
      console.log('✅ Step count watcher subscribed');
      pollIntervalRef.current = setInterval(async () => {
        try {
          if (startDateRef.current) {
            const endDate = new Date();
            const result = await Pedometer.getStepCountAsync(startDateRef.current, endDate);
            if (result.steps > 0) {
              console.log('📊 Polled step count:', result.steps);
              setRawSteps(result.steps);
            }
          }
        } catch (err) {
          console.error('Error polling steps:', err);
        }
      }, 2000);

      isInitializedRef.current = true;
      baselineRef.current = 0;
      setRawSteps(0);
      setIsTracking(true);
      setError(null);

      console.log('✅ Step tracking started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsAvailable(false);
      setIsTracking(false);
      console.error('Error starting step tracker:', err);
    }
  }, [hasPermission, requestPermission]);

  const stopTracking = useCallback(async () => {
    if (!isInitializedRef.current) {
      return;
    }

    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      isInitializedRef.current = false;
      setIsTracking(false);
      console.log('Step tracking stopped');
    } catch (err) {
      console.error('Error stopping step tracking:', err);
    }
  }, []);

  useEffect(() => {
    if (autoStart && isAvailable && hasPermission && !isTracking && !isInitializedRef.current) {
      startTracking();
    }
  }, [autoStart, isAvailable, hasPermission, isTracking, startTracking]);

  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        console.log('🧹 Cleaning up step tracking on unmount...');
        stopTracking();
      }
    };
  }, []); 

  const resetSteps = useCallback(() => {
    baselineRef.current = rawSteps;
  }, [rawSteps]);

  return {
    steps: calculatedSteps,
    isAvailable,
    isTracking,
    error,
    hasPermission,
    canAskAgain,
    startTracking,
    stopTracking,
    requestPermission,
    openSettings,
    resetSteps,
  };
};

export { calculatePowerLevelFromSteps } from '../utils/powerCalculation';

