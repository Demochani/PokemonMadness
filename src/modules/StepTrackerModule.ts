import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

interface StepTrackerModuleInterface {
  isAvailable(): Promise<boolean>;
  getStepCount(startDate: number, endDate: number): Promise<number>;
  startStepTracking(): Promise<void>;
  stopStepTracking(): Promise<void>;
  onStepUpdate(callback: (steps: number) => void): void;
  removeStepUpdateListener(): void;
}

const { StepTrackerModule } = NativeModules;

class StepTrackerModuleClass implements StepTrackerModuleInterface {
  private stepUpdateListeners: ((steps: number) => void)[] = [];
  private eventEmitter: NativeEventEmitter | null = null;
  private subscription: any = null;

  constructor() {
    if (StepTrackerModule) {
      this.eventEmitter = new NativeEventEmitter(StepTrackerModule);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!StepTrackerModule) {
      console.warn('StepTrackerModule native module is not available');
      return false;
    }
    try {
      const result = await StepTrackerModule.isAvailable();
      return Boolean(result);
    } catch (error) {
      console.error('Error checking step tracker availability:', error);
      return false;
    }
  }

  async getStepCount(startDate: number, endDate: number): Promise<number> {
    if (!StepTrackerModule) {
      throw new Error('StepTrackerModule is not available');
    }
    try {
      return await StepTrackerModule.getStepCount(startDate, endDate);
    } catch (error) {
      console.error('Error getting step count:', error);
      throw error;
    }
  }

  async startStepTracking(): Promise<void> {
    if (!StepTrackerModule) {
      throw new Error('StepTrackerModule is not available');
    }
    try {
      await StepTrackerModule.startStepTracking();
    } catch (error) {
      console.error('Error starting step tracking:', error);
      throw error;
    }
  }

  async stopStepTracking(): Promise<void> {
    if (!StepTrackerModule) {
      return;
    }
    try {
      await StepTrackerModule.stopStepTracking();
    } catch (error) {
      console.error('Error stopping step tracking:', error);
    }
  }

  onStepUpdate(callback: (steps: number) => void): void {
    if (!this.eventEmitter) {
      console.warn('Event emitter not available');
      return;
    }
    
    this.stepUpdateListeners.push(callback);
    console.log('Added step update listener. Total listeners:', this.stepUpdateListeners.length);
    
    if (!this.subscription) {
      console.log('Setting up event subscription for onStepUpdate');
      this.subscription = this.eventEmitter.addListener('onStepUpdate', (data: any) => {
         console.log('📡 Raw event data received:', data, typeof data);
         if (typeof data === 'object' && data !== null && data.error) {
           console.error('❌ Step tracking error from native:', data.error);
           return;
         }
         const steps = typeof data === 'object' && data !== null ? data.steps : data;
         console.log('📡 Extracted steps:', steps, typeof steps);
         if (typeof steps === 'number') {
           console.log('✅ Calling', this.stepUpdateListeners.length, 'listeners with steps:', steps);
           this.stepUpdateListeners.forEach(listener => listener(steps));
         } else {
           console.warn('⚠️ Steps is not a number:', steps);
         }
      });
      console.log('✅ Event subscription set up');
    }
  }

  removeStepUpdateListener(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.stepUpdateListeners = [];
  }
}

export const StepTracker = new StepTrackerModuleClass();

