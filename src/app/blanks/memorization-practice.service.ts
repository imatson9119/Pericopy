import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { BlankType } from './blanks.component';

export interface VelocityInfo {
  successVelocity: number;
  failureVelocity: number;
  lastResult: 'success' | 'failure' | null;
}

export interface BlanksModulePreferences {
  dynamicInputWidth: boolean;
}

export interface BlankCache {
  value: string;
  type: BlankType;
}

export interface PassageData {
  blanking: number;
  attempts: Array<{ correct: number; total: number; timestamp?: number }>;
  successVelocity: number;
  failureVelocity: number;
  lastResult: 'success' | 'failure' | null;
  seed: string;
  velocityInfo: VelocityInfo;
  cache: BlankCache[];
  lastSaved: number;
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
  preferences: BlanksModulePreferences;
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
  private storage: BlanksStorage | null = null;

  constructor() {}

  private getAll(): BlanksStorage {
    if (!this.storage) {
      this.storage = this.cleanPassageData(this.loadAll());
    }
    return this.storage;
  }

  private loadAll(): BlanksStorage {
    const val = localStorage.getItem(this.STORAGE_KEY);
    if (val) {
      try {
        const data = JSON.parse(val);
        return {
          passages: data.passages || {},
          recentPassages: data.recentPassages || [],
          preferences: data.preferences || this.createDefaultPreferences()
        };
      } catch {
        return this.createDefaultBlanksStorage();
      }
    }
    return this.createDefaultBlanksStorage();
  }

  cleanPassageData(storage: BlanksStorage): BlanksStorage {
    const newStorage = { ...storage };
    for (const passageId in newStorage.passages) {
      const passageData = newStorage.passages[passageId];
      if (!passageData.lastSaved || passageData.lastSaved < Date.now() - 1000 * 60 * 60 * 24 * 7) {
        delete newStorage.passages[passageId];
      }
    }
    return newStorage;
  }

  getPreferences(): BlanksModulePreferences {
    const storage = this.getAll();
    return storage.preferences;
  }

  savePreferences(preferences: BlanksModulePreferences): void {
    const storage = this.getAll();
    storage.preferences = preferences;
    this.saveAll(storage);
  }

  getPassageData(passageId: string): PassageData {
    const storage = this.getAll();
    if (!storage.passages[passageId]) {
      storage.passages[passageId] = this.createDefaultPassageData();
    }
    if (!storage.passages[passageId].seed) {
      storage.passages[passageId].seed = uuidv4();
    }
    if (!storage.passages[passageId].velocityInfo) {
      storage.passages[passageId].velocityInfo = this.createDefaultVelocityInfo();
    }
    return storage.passages[passageId];
  }

  savePassageData(passageId: string, data: PassageData): void {
    const storage = this.getAll();
    storage.passages[passageId] = data;
    this.saveAll(storage);
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
      lastResult: null,
      seed: uuidv4(),
      velocityInfo: this.createDefaultVelocityInfo(),
      cache: [],
      lastSaved: Date.now()
    };
  }

  private createDefaultVelocityInfo(): VelocityInfo {
    return {
      successVelocity: 1,
      failureVelocity: 1,
      lastResult: null
    };
  }

  private createDefaultPreferences(): BlanksModulePreferences {
    return {
      dynamicInputWidth: true
    };
  }

  private createDefaultBlanksStorage(): BlanksStorage {
    return {
      passages: {},
      recentPassages: [],
      preferences: this.createDefaultPreferences()
    };
  }

  trackRecentPassage(passageId: string, i: number, j: number): void {
    const storage = this.getAll();
    const timestamp = Date.now();
    
    storage.recentPassages = storage.recentPassages.filter(p => p.passageId !== passageId);
    storage.recentPassages.unshift({ passageId, timestamp, i, j });
    if (storage.recentPassages.length > this.MAX_RECENT_PASSAGES) {
      storage.recentPassages = storage.recentPassages.slice(0, this.MAX_RECENT_PASSAGES);
    }
    this.saveAll(storage);
  }

  getRecentPassages(): RecentPassage[] {
    const storage = this.getAll();
    return storage.recentPassages.slice();
  }

  getBlankingPercentage(passageId: string): number {
    const storage = this.getAll();
    if (storage.passages[passageId] && typeof storage.passages[passageId].blanking === 'number') {
      return storage.passages[passageId].blanking;
    }
    return this.DEFAULT_BLANKING;
  }

  setBlankingPercentage(passageId: string, percent: number): void {
    const bounded = Math.max(this.MIN_BLANKING, Math.min(this.MAX_BLANKING, percent));
    const storage = this.getAll();
    if (!storage.passages[passageId]) {
      storage.passages[passageId] = this.createDefaultPassageData();
    }
    storage.passages[passageId].blanking = bounded;
    this.saveAll(storage);
  }

  saveAttempt(passageId: string, result: { correct: number, total: number }): void {
    const storage = this.getAll();
    const attemptWithTimestamp = { ...result, timestamp: Date.now() };
    
    if (!storage.passages[passageId]) {
      storage.passages[passageId] = this.createDefaultPassageData();
    }
    
    storage.passages[passageId].attempts.push(attemptWithTimestamp);
    storage.passages[passageId].cache = [];
    storage.passages[passageId].seed = uuidv4();
    this.saveAll(storage);
  }

  getAttempts(passageId: string): Array<{ correct: number, total: number, timestamp?: number }> {
    const storage = this.getAll();
    if (storage.passages[passageId] && Array.isArray(storage.passages[passageId].attempts)) {
      return storage.passages[passageId].attempts;
    }
    return [];
  }

  getVelocityInfo(passageId: string): { successVelocity: number; failureVelocity: number; lastResult: string | null } {
    const storage = this.getAll();
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
    const storage = this.getAll();
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
} 