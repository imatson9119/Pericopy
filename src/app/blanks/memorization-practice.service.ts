import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MemorizationPracticeService {
  private readonly STORAGE_KEY = 'memorization-practice';
  private readonly DEFAULT_BLANKING = 0.2;
  private readonly MIN_BLANKING = 0.1;
  private readonly MAX_BLANKING = 0.8;

  constructor() {}

  private loadAll(): Record<string, { blanking: number, attempts: Array<{ correct: number, total: number }> }> {
    const val = localStorage.getItem(this.STORAGE_KEY);
    if (val) {
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    }
    return {};
  }

  private saveAll(data: Record<string, { blanking: number, attempts: Array<{ correct: number, total: number }> }>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  getBlankingPercentage(passageId: string): number {
    const all = this.loadAll();
    if (all[passageId] && typeof all[passageId].blanking === 'number') {
      return all[passageId].blanking;
    }
    return this.DEFAULT_BLANKING;
  }

  setBlankingPercentage(passageId: string, percent: number): void {
    const bounded = Math.max(this.MIN_BLANKING, Math.min(this.MAX_BLANKING, percent));
    const all = this.loadAll();
    if (!all[passageId]) {
      all[passageId] = { blanking: bounded, attempts: [] };
    } else {
      all[passageId].blanking = bounded;
    }
    this.saveAll(all);
  }

  saveAttempt(passageId: string, result: { correct: number, total: number }): void {
    const all = this.loadAll();
    if (!all[passageId]) {
      all[passageId] = { blanking: this.DEFAULT_BLANKING, attempts: [result] };
    } else {
      all[passageId].attempts.push(result);
    }
    this.saveAll(all);
  }

  getAttempts(passageId: string): Array<{ correct: number, total: number }> {
    const all = this.loadAll();
    if (all[passageId] && Array.isArray(all[passageId].attempts)) {
      return all[passageId].attempts;
    }
    return [];
  }

  adjustBlankingPercentage(passageId: string, lastScore: number): number {
    let percent = this.getBlankingPercentage(passageId);
    if (lastScore >= 0.9) {
      percent = Math.min(this.MAX_BLANKING, percent + 0.05);
    } else if (lastScore < 0.8) {
      percent = Math.max(this.MIN_BLANKING, percent - 0.05);
    }
    this.setBlankingPercentage(passageId, percent);
    return percent;
  }
} 