import { Injectable } from '@angular/core';

interface PassageData {
  blanking: number;
  attempts: Array<{ correct: number; total: number; timestamp?: number }>;
  successVelocity: number;
  failureVelocity: number;
  lastResult: 'success' | 'failure' | null;
}

interface RecentPassage {
  passageId: string;
  timestamp: number;
  i: number; // Start index
  j: number; // End index
}

interface BlanksStorage {
  passages: Record<string, PassageData>;
  recentPassages: RecentPassage[];
  // Goal-specific storage: goalId -> passageId -> PassageData
  goalPassages?: Record<string, Record<string, PassageData>>;
  // Goal-specific recent passages: goalId -> RecentPassage[]
  goalRecentPassages?: Record<string, RecentPassage[]>;
}

@Injectable({
  providedIn: 'root',
})
export class MemorizationPracticeService {
  private readonly STORAGE_KEY = 'memorization-practice';
  private readonly DEFAULT_BLANKING = 0.2;
  private readonly MIN_BLANKING = 0.1;
  private readonly MAX_BLANKING = 0.8;
  private readonly MAX_RECENT_PASSAGES = 10;
  
  // Velocity configuration
  private readonly BASE_ADJUSTMENT = 0.05;
  private readonly MAX_VELOCITY = 5;
  private readonly VELOCITY_MULTIPLIER = 1.5;
  private readonly SUCCESS_THRESHOLD = 0.9;
  private readonly FAILURE_THRESHOLD = 0.8;

  constructor() {}

  private loadAll(): BlanksStorage {
    const val = localStorage.getItem(this.STORAGE_KEY);
    if (val) {
      try {
        const data = JSON.parse(val);
        // New format - ensure structure is complete
        return {
          passages: data.passages || {},
          recentPassages: data.recentPassages || [],
          goalPassages: data.goalPassages || {},
          goalRecentPassages: data.goalRecentPassages || {}
        };
      } catch {
        return { 
          passages: {}, 
          recentPassages: [],
          goalPassages: {},
          goalRecentPassages: {}
        };
      }
    }
    return { 
      passages: {}, 
      recentPassages: [],
      goalPassages: {},
      goalRecentPassages: {}
    };
  }


  private saveAll(data: BlanksStorage): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private createDefaultPassageData(): PassageData {
    return {
      blanking: this.DEFAULT_BLANKING,
      attempts: [],
      successVelocity: 1,
      failureVelocity: 1,
      lastResult: null
    };
  }

  /**
   * Track a passage as recently used for blanks practice
   */
  trackRecentPassage(passageId: string, i: number, j: number): void {
    const storage = this.loadAll();
    const timestamp = Date.now();
    
    // Remove existing entry for this passage if it exists
    storage.recentPassages = storage.recentPassages.filter(p => p.passageId !== passageId);
    
    // Add to the beginning of the array
    storage.recentPassages.unshift({ passageId, timestamp, i, j });
    
    // Keep only the most recent passages
    if (storage.recentPassages.length > this.MAX_RECENT_PASSAGES) {
      storage.recentPassages = storage.recentPassages.slice(0, this.MAX_RECENT_PASSAGES);
    }
    
    this.saveAll(storage);
  }

  /**
   * Get recent passages for the passage selector
   */
  getRecentPassages(): RecentPassage[] {
    const storage = this.loadAll();
    return storage.recentPassages.slice(); // Return a copy
  }

  getBlankingPercentage(passageId: string): number {
    const storage = this.loadAll();
    if (storage.passages[passageId] && typeof storage.passages[passageId].blanking === 'number') {
      return storage.passages[passageId].blanking;
    }
    return this.DEFAULT_BLANKING;
  }

  setBlankingPercentage(passageId: string, percent: number): void {
    const bounded = Math.max(this.MIN_BLANKING, Math.min(this.MAX_BLANKING, percent));
    const storage = this.loadAll();
    if (!storage.passages[passageId]) {
      storage.passages[passageId] = this.createDefaultPassageData();
    }
    storage.passages[passageId].blanking = bounded;
    this.saveAll(storage);
  }

  saveAttempt(passageId: string, result: { correct: number, total: number }): void {
    const storage = this.loadAll();
    const attemptWithTimestamp = { ...result, timestamp: Date.now() };
    
    if (!storage.passages[passageId]) {
      storage.passages[passageId] = this.createDefaultPassageData();
    }
    
    storage.passages[passageId].attempts.push(attemptWithTimestamp);
    this.saveAll(storage);
  }

  getAttempts(passageId: string): Array<{ correct: number, total: number, timestamp?: number }> {
    const storage = this.loadAll();
    if (storage.passages[passageId] && Array.isArray(storage.passages[passageId].attempts)) {
      return storage.passages[passageId].attempts;
    }
    return [];
  }

  /**
   * Get the current velocity information for a passage
   */
  getVelocityInfo(passageId: string): { successVelocity: number; failureVelocity: number; lastResult: string | null } {
    const storage = this.loadAll();
    if (storage.passages[passageId]) {
      return {
        successVelocity: storage.passages[passageId].successVelocity,
        failureVelocity: storage.passages[passageId].failureVelocity,
        lastResult: storage.passages[passageId].lastResult
      };
    }
    return { successVelocity: 1, failureVelocity: 1, lastResult: null };
  }

  adjustBlankingPercentage(passageId: string, lastScore: number): number {
    const storage = this.loadAll();
    if (!storage.passages[passageId]) {
      storage.passages[passageId] = this.createDefaultPassageData();
    }

    const passageData = storage.passages[passageId];
    let percent = passageData.blanking;
    const isSuccess = lastScore >= this.SUCCESS_THRESHOLD;
    const isFailure = lastScore < this.FAILURE_THRESHOLD;

    if (isSuccess) {
      // Handle success
      if (passageData.lastResult === 'success') {
        // Consecutive success - increase velocity
        passageData.successVelocity = Math.min(
          this.MAX_VELOCITY, 
          passageData.successVelocity * this.VELOCITY_MULTIPLIER
        );
      } else {
        // First success or coming from failure - reset success velocity
        passageData.successVelocity = 1;
        passageData.failureVelocity = 1; // Reset failure velocity
      }
      
      // Apply difficulty increase with velocity
      const adjustment = this.BASE_ADJUSTMENT * passageData.successVelocity;
      percent = Math.min(this.MAX_BLANKING, percent + adjustment);
      passageData.lastResult = 'success';
      
    } else if (isFailure) {
      // Handle failure
      if (passageData.lastResult === 'failure') {
        // Consecutive failure - increase velocity
        passageData.failureVelocity = Math.min(
          this.MAX_VELOCITY, 
          passageData.failureVelocity * this.VELOCITY_MULTIPLIER
        );
      } else {
        // First failure or coming from success - reset failure velocity
        passageData.failureVelocity = 1;
        passageData.successVelocity = 1; // Reset success velocity
      }
      
      // Apply difficulty decrease with velocity
      const adjustment = this.BASE_ADJUSTMENT * passageData.failureVelocity;
      percent = Math.max(this.MIN_BLANKING, percent - adjustment);
      passageData.lastResult = 'failure';
      
    } else {
      // Neutral score (between failure and success thresholds) - maintain current difficulty
      // Reset velocities since this breaks any streak
      passageData.successVelocity = 1;
      passageData.failureVelocity = 1;
      passageData.lastResult = null;
    }

    passageData.blanking = percent;
    this.saveAll(storage);
    return percent;
  }

  /**
   * Get difficulty adjustment preview for UI feedback
   */
  getDifficultyAdjustmentPreview(passageId: string, score: number): {
    currentDifficulty: number;
    newDifficulty: number;
    adjustment: number;
    velocity: number;
    adjustmentType: 'increase' | 'decrease' | 'maintain';
  } {
    const storage = this.loadAll();
    const passageData = storage.passages[passageId] || this.createDefaultPassageData();
    const currentDifficulty = passageData.blanking;
    
    const isSuccess = score >= this.SUCCESS_THRESHOLD;
    const isFailure = score < this.FAILURE_THRESHOLD;
    
    let velocity = 1;
    let adjustmentType: 'increase' | 'decrease' | 'maintain' = 'maintain';
    let adjustment = 0;
    
    if (isSuccess) {
      adjustmentType = 'increase';
      if (passageData.lastResult === 'success') {
        velocity = Math.min(this.MAX_VELOCITY, passageData.successVelocity * this.VELOCITY_MULTIPLIER);
      }
      adjustment = this.BASE_ADJUSTMENT * velocity;
    } else if (isFailure) {
      adjustmentType = 'decrease';
      if (passageData.lastResult === 'failure') {
        velocity = Math.min(this.MAX_VELOCITY, passageData.failureVelocity * this.VELOCITY_MULTIPLIER);
      }
      adjustment = this.BASE_ADJUSTMENT * velocity;
    }
    
    let newDifficulty = currentDifficulty;
    if (adjustmentType === 'increase') {
      newDifficulty = Math.min(this.MAX_BLANKING, currentDifficulty + adjustment);
    } else if (adjustmentType === 'decrease') {
      newDifficulty = Math.max(this.MIN_BLANKING, currentDifficulty - adjustment);
    }
    
    return {
      currentDifficulty,
      newDifficulty,
      adjustment,
      velocity,
      adjustmentType
    };
  }

  // ===== GOAL-SPECIFIC METHODS =====

  /**
   * Get the storage key for a specific goal and passage combination
   */
  private getGoalPassageKey(goalId: string, passageId: string): string {
    return `${goalId}:${passageId}`;
  }

  /**
   * Get goal-specific passage data
   */
  private getGoalPassageData(goalId: string, passageId: string): PassageData {
    const storage = this.loadAll();
    if (!storage.goalPassages) {
      storage.goalPassages = {};
    }
    if (!storage.goalPassages[goalId]) {
      storage.goalPassages[goalId] = {};
    }
    if (!storage.goalPassages[goalId][passageId]) {
      storage.goalPassages[goalId][passageId] = this.createDefaultPassageData();
    }
    return storage.goalPassages[goalId][passageId];
  }

  /**
   * Save goal-specific passage data
   */
  private saveGoalPassageData(goalId: string, passageId: string, data: PassageData): void {
    const storage = this.loadAll();
    if (!storage.goalPassages) {
      storage.goalPassages = {};
    }
    if (!storage.goalPassages[goalId]) {
      storage.goalPassages[goalId] = {};
    }
    storage.goalPassages[goalId][passageId] = data;
    this.saveAll(storage);
  }

  /**
   * Track a passage as recently used for a specific goal
   */
  trackRecentPassageForGoal(goalId: string, passageId: string, i: number, j: number): void {
    const storage = this.loadAll();
    const timestamp = Date.now();
    
    if (!storage.goalRecentPassages) {
      storage.goalRecentPassages = {};
    }
    if (!storage.goalRecentPassages[goalId]) {
      storage.goalRecentPassages[goalId] = [];
    }
    
    // Remove existing entry for this passage if it exists
    storage.goalRecentPassages[goalId] = storage.goalRecentPassages[goalId].filter(p => p.passageId !== passageId);
    
    // Add to the beginning of the array
    storage.goalRecentPassages[goalId].unshift({ passageId, timestamp, i, j });
    
    // Keep only the most recent passages
    if (storage.goalRecentPassages[goalId].length > this.MAX_RECENT_PASSAGES) {
      storage.goalRecentPassages[goalId] = storage.goalRecentPassages[goalId].slice(0, this.MAX_RECENT_PASSAGES);
    }
    
    this.saveAll(storage);
  }

  /**
   * Get recent passages for a specific goal
   */
  getRecentPassagesForGoal(goalId: string): RecentPassage[] {
    const storage = this.loadAll();
    if (!storage.goalRecentPassages || !storage.goalRecentPassages[goalId]) {
      return [];
    }
    return storage.goalRecentPassages[goalId].slice(); // Return a copy
  }

  /**
   * Get blanking percentage for a specific goal and passage
   */
  getBlankingPercentageForGoal(goalId: string, passageId: string): number {
    const passageData = this.getGoalPassageData(goalId, passageId);
    return passageData.blanking;
  }

  /**
   * Set blanking percentage for a specific goal and passage
   */
  setBlankingPercentageForGoal(goalId: string, passageId: string, percent: number): void {
    const bounded = Math.max(this.MIN_BLANKING, Math.min(this.MAX_BLANKING, percent));
    const passageData = this.getGoalPassageData(goalId, passageId);
    passageData.blanking = bounded;
    this.saveGoalPassageData(goalId, passageId, passageData);
  }

  /**
   * Save attempt for a specific goal and passage
   */
  saveAttemptForGoal(goalId: string, passageId: string, result: { correct: number, total: number }): void {
    const attemptWithTimestamp = { ...result, timestamp: Date.now() };
    const passageData = this.getGoalPassageData(goalId, passageId);
    passageData.attempts.push(attemptWithTimestamp);
    this.saveGoalPassageData(goalId, passageId, passageData);
  }

  /**
   * Get attempts for a specific goal and passage
   */
  getAttemptsForGoal(goalId: string, passageId: string): Array<{ correct: number, total: number, timestamp?: number }> {
    const passageData = this.getGoalPassageData(goalId, passageId);
    return passageData.attempts;
  }

  /**
   * Get velocity information for a specific goal and passage
   */
  getVelocityInfoForGoal(goalId: string, passageId: string): { successVelocity: number; failureVelocity: number; lastResult: string | null } {
    const passageData = this.getGoalPassageData(goalId, passageId);
    return {
      successVelocity: passageData.successVelocity,
      failureVelocity: passageData.failureVelocity,
      lastResult: passageData.lastResult
    };
  }

  /**
   * Adjust blanking percentage for a specific goal and passage
   */
  adjustBlankingPercentageForGoal(goalId: string, passageId: string, lastScore: number): number {
    const passageData = this.getGoalPassageData(goalId, passageId);
    let percent = passageData.blanking;
    const isSuccess = lastScore >= this.SUCCESS_THRESHOLD;
    const isFailure = lastScore < this.FAILURE_THRESHOLD;

    if (isSuccess) {
      // Handle success
      if (passageData.lastResult === 'success') {
        // Consecutive success - increase velocity
        passageData.successVelocity = Math.min(
          this.MAX_VELOCITY, 
          passageData.successVelocity * this.VELOCITY_MULTIPLIER
        );
      } else {
        // First success or coming from failure - reset success velocity
        passageData.successVelocity = 1;
        passageData.failureVelocity = 1; // Reset failure velocity
      }
      
      // Apply difficulty increase with velocity
      const adjustment = this.BASE_ADJUSTMENT * passageData.successVelocity;
      percent = Math.min(this.MAX_BLANKING, percent + adjustment);
      passageData.lastResult = 'success';
      
    } else if (isFailure) {
      // Handle failure
      if (passageData.lastResult === 'failure') {
        // Consecutive failure - increase velocity
        passageData.failureVelocity = Math.min(
          this.MAX_VELOCITY, 
          passageData.failureVelocity * this.VELOCITY_MULTIPLIER
        );
      } else {
        // First failure or coming from success - reset failure velocity
        passageData.failureVelocity = 1;
        passageData.successVelocity = 1; // Reset success velocity
      }
      
      // Apply difficulty decrease with velocity
      const adjustment = this.BASE_ADJUSTMENT * passageData.failureVelocity;
      percent = Math.max(this.MIN_BLANKING, percent - adjustment);
      passageData.lastResult = 'failure';
      
    } else {
      // Neutral score (between failure and success thresholds) - maintain current difficulty
      // Reset velocities since this breaks any streak
      passageData.successVelocity = 1;
      passageData.failureVelocity = 1;
      passageData.lastResult = null;
    }

    passageData.blanking = percent;
    this.saveGoalPassageData(goalId, passageId, passageData);
    return percent;
  }

  /**
   * Get difficulty adjustment preview for a specific goal and passage
   */
  getDifficultyAdjustmentPreviewForGoal(goalId: string, passageId: string, score: number): {
    currentDifficulty: number;
    newDifficulty: number;
    adjustment: number;
    velocity: number;
    adjustmentType: 'increase' | 'decrease' | 'maintain';
  } {
    const passageData = this.getGoalPassageData(goalId, passageId);
    const currentDifficulty = passageData.blanking;
    
    const isSuccess = score >= this.SUCCESS_THRESHOLD;
    const isFailure = score < this.FAILURE_THRESHOLD;
    
    let velocity = 1;
    let adjustmentType: 'increase' | 'decrease' | 'maintain' = 'maintain';
    let adjustment = 0;
    
    if (isSuccess) {
      adjustmentType = 'increase';
      if (passageData.lastResult === 'success') {
        velocity = Math.min(this.MAX_VELOCITY, passageData.successVelocity * this.VELOCITY_MULTIPLIER);
      }
      adjustment = this.BASE_ADJUSTMENT * velocity;
    } else if (isFailure) {
      adjustmentType = 'decrease';
      if (passageData.lastResult === 'failure') {
        velocity = Math.min(this.MAX_VELOCITY, passageData.failureVelocity * this.VELOCITY_MULTIPLIER);
      }
      adjustment = this.BASE_ADJUSTMENT * velocity;
    }
    
    let newDifficulty = currentDifficulty;
    if (adjustmentType === 'increase') {
      newDifficulty = Math.min(this.MAX_BLANKING, currentDifficulty + adjustment);
    } else if (adjustmentType === 'decrease') {
      newDifficulty = Math.max(this.MIN_BLANKING, currentDifficulty - adjustment);
    }
    
    return {
      currentDifficulty,
      newDifficulty,
      adjustment,
      velocity,
      adjustmentType
    };
  }

  /**
   * Check if a goal has reached maximum blanking difficulty for a passage
   */
  hasReachedMaxDifficultyForGoal(goalId: string, passageId: string): boolean {
    const passageData = this.getGoalPassageData(goalId, passageId);
    return passageData.blanking >= this.MAX_BLANKING;
  }

  /**
   * Get all goal-specific data for a goal (for migration or cleanup)
   */
  getGoalData(goalId: string): { passages: Record<string, PassageData>; recentPassages: RecentPassage[] } {
    const storage = this.loadAll();
    return {
      passages: storage.goalPassages?.[goalId] || {},
      recentPassages: storage.goalRecentPassages?.[goalId] || []
    };
  }

  /**
   * Delete all data for a specific goal
   */
  deleteGoalData(goalId: string): void {
    const storage = this.loadAll();
    if (storage.goalPassages) {
      delete storage.goalPassages[goalId];
    }
    if (storage.goalRecentPassages) {
      delete storage.goalRecentPassages[goalId];
    }
    this.saveAll(storage);
  }

  /**
   * Migrate existing freestyle data to a goal (useful for creating goals from existing practice)
   */
  migrateFreestyleDataToGoal(goalId: string, passageId: string): void {
    const storage = this.loadAll();
    const freestyleData = storage.passages[passageId];
    
    if (freestyleData) {
      // Copy the freestyle data to the goal-specific storage
      if (!storage.goalPassages) {
        storage.goalPassages = {};
      }
      if (!storage.goalPassages[goalId]) {
        storage.goalPassages[goalId] = {};
      }
      
      // Deep copy the data to avoid reference issues
      storage.goalPassages[goalId][passageId] = {
        blanking: freestyleData.blanking,
        attempts: [...freestyleData.attempts],
        successVelocity: freestyleData.successVelocity,
        failureVelocity: freestyleData.failureVelocity,
        lastResult: freestyleData.lastResult
      };
      
      this.saveAll(storage);
    }
  }
} 