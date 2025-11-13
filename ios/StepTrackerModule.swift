import Foundation
import CoreMotion

@objc(StepTrackerModule)
class StepTrackerModule: RCTEventEmitter {
    private let pedometer = CMPedometer()
    private var isTracking = false
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func supportedEvents() -> [String]! {
        return ["onStepUpdate"]
    }
    
    @objc
    func isAvailable(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let available = CMPedometer.isStepCountingAvailable()
        print("🔍 [StepTrackerModule] isAvailable called, result: \(available)")
        resolve(NSNumber(value: available))
    }
    
    @objc
    func getStepCount(_ startDate: NSNumber, endDate: NSNumber, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let start = Date(timeIntervalSince1970: startDate.doubleValue / 1000.0)
        let end = Date(timeIntervalSince1970: endDate.doubleValue / 1000.0)
        
        print("🔍 [StepTrackerModule] getStepCount called: \(start) to \(end)")
        
        pedometer.queryPedometerData(from: start, to: end) { data, error in
            if let error = error {
                print("❌ [StepTrackerModule] Error querying steps: \(error.localizedDescription)")
                reject("STEP_COUNT_ERROR", error.localizedDescription, error)
                return
            }
            
            let steps = data?.numberOfSteps.intValue ?? 0
            print("✅ [StepTrackerModule] Steps queried: \(steps)")
            resolve(NSNumber(value: steps))
        }
    }
    
    @objc
    func startStepTracking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if isTracking {
            print("⚠️ [StepTrackerModule] Already tracking, skipping")
            resolve(NSNull())
            return
        }
        
        print("🚀 [StepTrackerModule] Starting step tracking...")
        
        guard CMPedometer.isStepCountingAvailable() else {
            let error = NSError(domain: "StepTracker", code: 1, userInfo: [NSLocalizedDescriptionKey: "Step counting is not available on this device"])
            print("❌ [StepTrackerModule] Step counting not available")
            reject("NOT_AVAILABLE", "Step counting is not available", error)
            return
        }
        
        let startDate = Date()
        isTracking = true
        
        pedometer.startUpdates(from: startDate) { [weak self] data, error in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                if let error = error {
                    print("❌ [StepTrackerModule] Error in startUpdates: \(error.localizedDescription)")
                    self.sendEvent(withName: "onStepUpdate", body: ["error": error.localizedDescription])
                    self.isTracking = false
                    return
                }
                
                guard let data = data else {
                    print("⚠️ [StepTrackerModule] No data received")
                    return
                }
                
                let steps = data.numberOfSteps.intValue
                print("📊 [StepTrackerModule] Step update: \(steps) steps")
                
                self.sendEvent(withName: "onStepUpdate", body: ["steps": NSNumber(value: steps)])
            }
        }
        
        // Query initial step count
        pedometer.queryPedometerData(from: startDate, to: Date()) { [weak self] data, error in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                if let error = error {
                    print("⚠️ [StepTrackerModule] Error querying initial steps: \(error.localizedDescription)")
                    return
                }
                
                let steps = data?.numberOfSteps.intValue ?? 0
                print("📊 [StepTrackerModule] Initial step count: \(steps)")
                self.sendEvent(withName: "onStepUpdate", body: ["steps": NSNumber(value: steps)])
            }
        }
        
        print("✅ [StepTrackerModule] Step tracking started")
        resolve(NSNull())
    }
    
    @objc
    func stopStepTracking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if !isTracking {
            print("⚠️ [StepTrackerModule] Not tracking, skipping")
            resolve(NSNull())
            return
        }
        
        print("🛑 [StepTrackerModule] Stopping step tracking...")
        pedometer.stopUpdates()
        isTracking = false
        print("✅ [StepTrackerModule] Step tracking stopped")
        resolve(NSNull())
    }
}

