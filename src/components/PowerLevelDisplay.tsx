import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';

interface PowerLevelDisplayProps {
  powerLevel: number;
  stepsFromPower: number;
  totalSteps: number;
  isLoading?: boolean;
  isTracking?: boolean;
  error?: string | null;
  hasPermission?: boolean;
  canAskAgain?: boolean;
  onRequestPermission?: () => Promise<boolean> | Promise<void> | void;
  onOpenSettings?: () => Promise<void> | void;
}

export const PowerLevelDisplay: FC<PowerLevelDisplayProps> = ({
  powerLevel,
  stepsFromPower,
  totalSteps,
  isLoading = false,
  isTracking = false,
  error = null,
  hasPermission = true,
  canAskAgain = true,
  onRequestPermission,
  onOpenSettings,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const previousPowerLevel = useRef(powerLevel);
  const previousSteps = useRef(totalSteps);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);

  const progress = (totalSteps % 100) / 100;

  useEffect(() => {
    if (powerLevel > previousPowerLevel.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    previousPowerLevel.current = powerLevel;
  }, [powerLevel, scaleAnim]);

  const animateProgress = useCallback(
    (value: number) => {
      Animated.timing(progressAnim, {
        toValue: value,
        duration: 300,
        useNativeDriver: false,
      }).start();
    },
    [progressAnim],
  );

  useEffect(() => {
    if (previousSteps.current === 0 && totalSteps === 0) {
      progressAnim.setValue(hasPermission ? progress : 0);
    } else if (totalSteps !== previousSteps.current || !hasPermission) {
      animateProgress(hasPermission ? progress : 0);
    }
    previousSteps.current = totalSteps;
  }, [totalSteps, progress, animateProgress, hasPermission]);

  useEffect(() => {
    if (!hasPermission) {
      animateProgress(0);
    }
  }, [hasPermission, animateProgress]);

  const handleRequestPermission = useCallback(async () => {
    if (!onRequestPermission) return;
    setIsRequestingPermission(true);
    try {
      await onRequestPermission();
    } finally {
      setIsRequestingPermission(false);
    }
  }, [onRequestPermission]);

  const handleOpenSettings = useCallback(async () => {
    if (!onOpenSettings) return;
    try {
      await onOpenSettings();
    } catch (err) {
      console.error('Error opening settings:', err);
    }
  }, [onOpenSettings]);

  return (
    <View style={styles.container}>
      <View style={styles.powerLevelContainer}>
        <Text style={styles.label}>Power Level</Text>
        <Animated.View style={[styles.powerLevelBox, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.powerLevelText}>{powerLevel}</Text>
        </Animated.View>
      </View>

      <View style={styles.stepsContainer}>
        <View style={styles.stepsHeader}>
          <Text style={styles.stepsLabel}>Steps: {totalSteps}</Text>
          {isTracking ? (
            <View style={styles.trackingIndicator}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>Tracking</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>⚠️ {error}</Text>
          ) : (
            <Text style={styles.waitingText}>Waiting to start...</Text>
          )}
        </View>
        {!hasPermission && (
          <View style={styles.permissionBanner}>
            <Text style={styles.permissionText}>
              {canAskAgain
                ? 'Step tracking requires motion permission.'
                : 'Permission denied. Please enable Motion & Fitness in Settings.'}
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={canAskAgain ? handleRequestPermission : handleOpenSettings}
              disabled={isRequestingPermission && canAskAgain}
            >
              {isRequestingPermission && canAskAgain ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.permissionButtonText}>
                  {canAskAgain ? 'Grant Permission' : 'Open Settings'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        {hasPermission ? (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>{Math.round(progress * 100)}% complete</Text>
            <Text style={styles.nextLevelText}>
              {100 - (totalSteps % 100)} steps until next level
            </Text>
          </View>
        ) : (
          <Text style={styles.permissionHint}>Grant permission to start tracking steps.</Text>
        )}
      </View>

      {stepsFromPower > 0 && (
        <View style={styles.bonusContainer}>
          <Text style={styles.bonusText}>+{stepsFromPower} from steps today!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    margin: 16,
  },
  powerLevelContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  powerLevelBox: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  powerLevelText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepsContainer: {
    marginTop: 16,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepsLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
  },
  trackingText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  permissionBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFECB5',
  },
  permissionText: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 8,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  nextLevelText: {
    fontSize: 12,
    color: '#999',
  },
  bonusContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    alignItems: 'center',
  },
  bonusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

