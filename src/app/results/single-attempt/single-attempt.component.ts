import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { DiffType, IResult, ResultBank } from 'src/app/classes/models';
import { StorageService } from 'src/app/services/storage.service';
import { DiffDisplayComponent, DisplayType } from '../diff-display/diff-display.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteAttemptDialogComponent } from './delete-attempt-dialog/delete-attempt-dialog.component';
import { Bible } from 'src/app/classes/Bible';
import { Subscription } from 'rxjs';
import { BibleService } from 'src/app/services/bible.service';
import { Goal, GoalStatus } from 'src/app/classes/Goal';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { SelectGoalsDialogComponent } from 'src/app/misc-components/select-goals-dialog/select-goals-dialog.component';
import { intersection } from 'src/app/utils/utils';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface PerformanceMetrics {
  accuracy: number;
  totalWords: number;
  totalMistakes: number;
  longestSequence: number;
  wordsPerMinute?: number;
  consistencyScore: number;
  difficultyRating: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
}

@Component({
    selector: 'app-single-attempt',
    templateUrl: './single-attempt.component.html',
    styleUrls: ['./single-attempt.component.scss'],
    imports: [
      MatButtonModule,
      MatIconModule,
      MatDialogModule,
      MatProgressSpinnerModule,
      MatTooltipModule,
      DiffDisplayComponent,
      MatTabsModule,
      CommonModule,
    ]
})
export class SingleAttemptComponent implements OnInit, OnDestroy {
  result_bank: ResultBank = {"version":1,"results": new Map()};
  diffTypes = DiffType;
  displayTypes = DisplayType;
  resultId = "";

  currentResult: IResult | undefined = undefined;
  relatedGoals: Goal[] = [];
  performanceMetrics: PerformanceMetrics = {
    accuracy: 0,
    totalWords: 0,
    totalMistakes: 0,
    longestSequence: 0,
    consistencyScore: 0,
    difficultyRating: 0,
    improvementTrend: 'stable'
  };
  
  statCards: StatCard[] = [];
  bible: Bible | undefined = undefined;
  subscriptions: Subscription[] = [];
  GoalStatus = GoalStatus;

  constructor(
    private _router: Router,
    private _storageService: StorageService,
    private _bibleService: BibleService, 
    private dialog: MatDialog, 
    private _location: Location,
    private titleService: Title,
    private metaService: Meta,
    private _snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.updatePageMetadata();
    
    this.result_bank = this._storageService.getBank();
    let id = this._router.parseUrl(this._router.url).queryParams['id'];
    if(id != undefined){
      this.setResult(id);
    } else {
      this._router.navigateByUrl('/history');
    }

    this.subscriptions.push(this._bibleService.curBible.subscribe(
      (bible) => {
        this.bible = bible;
      }
    ));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updatePageMetadata(): void {
    let pageTitle = 'Recitation Result | Pericopy';
    let pageDescription = 'Comprehensive analysis of your scripture recitation with detailed metrics, goal tracking, and performance insights.';

    if(this.currentResult){
      pageTitle = `${this.currentResult.diff.p} - Recitation Result | Pericopy`;
      pageDescription = `Comprehensive analysis of your scripture recitation for ${this.currentResult.diff.p} with detailed metrics, goal tracking, and performance insights.`;
    }
    
    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:url', content: 'https://pericopy.net/results' });
  } 

  setResult(id: string): void {
    if(!this.result_bank.results.has(id)){
      this._router.navigateByUrl('/history');
      return;
    }
    this.resultId = id;
    this.currentResult = this.result_bank.results.get(id);
    this.loadRelatedGoals();
    this.generatePerformanceMetrics();
    this.generateStatCards();
    this.updatePageMetadata();
  }

  loadRelatedGoals(): void {
    if (!this.currentResult) return;
    
    this.relatedGoals = [];
    const allGoals = this._storageService.getGoals();
    
    for (const goalId of this.currentResult.goals) {
      const goal = allGoals.get(goalId);
      if (goal) {
        this.relatedGoals.push(goal);
      }
    }
  }

  generatePerformanceMetrics(): void {
    if(!this.currentResult) return;
    
    let totalWords = 0;
    let totalMistakes = 0;
    let longestSequence = 0;
    let currentSequence = 0;
    let addedWords = 0;
    let removedWords = 0;
    let unchangedWords = 0;

    for(let bookDiff of this.currentResult.diff.v){
      for(let chapterDiff of bookDiff.v){
        for(let verseDiff of chapterDiff.v){
          for(let change of verseDiff.v){
            if (change.t === DiffType.ADDED) {
              addedWords += change.v.length;
              totalMistakes += change.v.length;
              longestSequence = Math.max(longestSequence, currentSequence);
              currentSequence = 0;
            } else if (change.t === DiffType.REMOVED) {
              removedWords += change.v.length;
              totalMistakes += change.v.length;
              longestSequence = Math.max(longestSequence, currentSequence);
              currentSequence = 0;
            } else {
              unchangedWords += change.v.length;
              currentSequence += change.v.length;
            }
            totalWords += change.v.length;
          }
        }
      }
    }
    longestSequence = Math.max(longestSequence, currentSequence);

    this.performanceMetrics = {
      accuracy: Math.round(this.currentResult.score * 100),
      totalWords,
      totalMistakes,
      longestSequence,
      consistencyScore: 0,
      difficultyRating: 0,
      improvementTrend: 'stable'
    };

    // Calculate consistency score (based on distribution of mistakes)
    this.performanceMetrics.consistencyScore = this.calculateConsistencyScore();
    
    // Calculate difficulty rating (based on passage complexity and performance)
    this.performanceMetrics.difficultyRating = this.calculateDifficultyRating();
    
    // Calculate improvement trend
    this.performanceMetrics.improvementTrend = this.calculateImprovementTrend();
  }

  calculateConsistencyScore(): number {
    // Simplified consistency calculation based on mistake distribution
    if (!this.currentResult) return 0;
    
    const accuracy = this.currentResult.score;
    
    // Avoid division by zero
    if (this.performanceMetrics.totalWords === 0) return 0;
    
    const mistakeDistribution = this.performanceMetrics.totalMistakes / this.performanceMetrics.totalWords;
    
    // Higher consistency when mistakes are fewer and more evenly distributed
    const consistencyScore = (accuracy * 0.7 + (1 - mistakeDistribution) * 0.3) * 100;
    
    // Ensure we return a valid number
    return Math.round(isNaN(consistencyScore) ? 0 : consistencyScore);
  }

  calculateDifficultyRating(): number {
    // Simplified difficulty calculation based on passage length and performance
    if (!this.currentResult) return 0;
    
    const passageLength = this.performanceMetrics.totalWords;
    const accuracy = this.currentResult.score;
    
    // Difficulty increases with passage length and decreases with accuracy
    const lengthFactor = Math.min(passageLength / 100, 1); // Normalize to 0-1
    const performanceFactor = 1 - accuracy;
    
    return Math.round((lengthFactor * 0.4 + performanceFactor * 0.6) * 10);
  }

  calculateImprovementTrend(): 'improving' | 'declining' | 'stable' {
    // Get recent attempts for comparison
    const recentAttempts = Array.from(this.result_bank.results.values())
      .filter(attempt => attempt.timestamp < this.currentResult!.timestamp)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);

    if (recentAttempts.length === 0) return 'stable';

    const currentScore = this.currentResult!.score;
    const avgRecentScore = recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / recentAttempts.length;

    if (currentScore > avgRecentScore + 0.05) return 'improving';
    if (currentScore < avgRecentScore - 0.05) return 'declining';
    return 'stable';
  }

  generateStatCards(): void {
    const metrics = this.performanceMetrics;
    
    this.statCards = [
      {
        label: 'Accuracy',
        value: `${metrics.accuracy}%`,
        icon: 'gps_fixed',
        color: this.getAccuracyColor(metrics.accuracy),
        description: 'Overall recitation accuracy',
        trend: metrics.improvementTrend === 'improving' ? 'up' : metrics.improvementTrend === 'declining' ? 'down' : 'neutral'
      },
      {
        label: 'Total Words',
        value: metrics.totalWords,
        icon: 'text_fields',
        color: '#6366f1',
        description: 'Words in this passage'
      },
      {
        label: 'Mistakes',
        value: metrics.totalMistakes,
        icon: 'error_outline',
        color: metrics.totalMistakes === 0 ? '#10b981' : metrics.totalMistakes < 5 ? '#f59e0b' : '#ef4444',
        description: 'Words added or removed'
      },
      {
        label: 'Best Streak',
        value: metrics.longestSequence,
        icon: 'trending_up',
        color: '#8b5cf6',
        description: 'Longest correct word sequence'
      },
      {
        label: 'Consistency',
        value: `${metrics.consistencyScore}%`,
        icon: 'analytics',
        color: this.getConsistencyColor(metrics.consistencyScore),
        description: 'Performance consistency score'
      },
      {
        label: 'Difficulty',
        value: `${metrics.difficultyRating}/10`,
        icon: 'psychology',
        color: this.getDifficultyColor(metrics.difficultyRating),
        description: 'Estimated passage difficulty'
      }
    ];
  }

  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 95) return '#10b981'; // green
    if (accuracy >= 85) return '#f59e0b'; // yellow
    if (accuracy >= 70) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  getConsistencyColor(consistency: number): string {
    if (consistency >= 90) return '#10b981';
    if (consistency >= 75) return '#f59e0b';
    return '#ef4444';
  }

  getDifficultyColor(difficulty: number): string {
    if (difficulty <= 3) return '#10b981';
    if (difficulty <= 6) return '#f59e0b';
    return '#ef4444';
  }

  deleteResult(): void {
    if(this.currentResult === undefined || this.resultId === ""){
      return;
    }
    this.dialog.open(DeleteAttemptDialogComponent).afterClosed().subscribe(result => {
      if(result){
        this._storageService.deleteAttempt(this.resultId);
        this._snackbarService.showSuccess('Result deleted. Just like it never happened. 👀', 3000);
        this._location.back();
      }
    });
  }

  editResult(): void {
    if(this.currentResult === undefined || this.resultId === ""){
      return;
    }
    this._router.navigate(['/recite'], { queryParams: { id: this.resultId } });
  }

  navigateToGoal(goalId: string): void {
    this._router.navigate(['/goal'], { queryParams: { id: goalId } });
  }

  getGoalStatusIcon(status: GoalStatus | undefined): string {
    switch (status) {
      case GoalStatus.MEMORIZING: return 'flag';
      case GoalStatus.MAINTAINING: return 'flag';
      case GoalStatus.MASTERED: return 'flag';
      default: return 'flag';
    }
  }

  getGoalStatusColor(status: GoalStatus | undefined): string {
    switch (status) {
      case GoalStatus.MEMORIZING: return '#3b82f6';
      case GoalStatus.MAINTAINING: return '#f59e0b';
      case GoalStatus.MASTERED: return '#10b981';
      default: return '#6b7280';
    }
  }

  getGoalStatusText(status: GoalStatus | undefined): string {
    switch (status) {
      case GoalStatus.MEMORIZING: return 'Memorizing';
      case GoalStatus.MAINTAINING: return 'Maintaining';
      case GoalStatus.MASTERED: return 'Mastered';
      default: return 'Unknown';
    }
  }

  getTrendIcon(trend?: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTrendColor(trend?: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  }

  editLinkedGoals(): void {
    // Need to collect all goals that intersect with the current result
    const intersectingGoals = [...this._storageService.getGoals().values()].filter((g) => {
      return intersection(this.currentResult!.diff.i, this.currentResult!.diff.j, g.i, g.j);
    }).map((g) => {
      return { goal: g, selected: this.relatedGoals.includes(g) };
    });
    this.dialog.open(SelectGoalsDialogComponent, {
      data: {
        goals: intersectingGoals
      }
    }).afterClosed().subscribe((goals: Goal[]) => {
      if(goals) {
        let removed_goals = [...this.currentResult!.goals].filter((g) => !goals.some((g2) => g2.id === g));
        for (let goalId of removed_goals) {
          let goal = this._storageService.getGoal(goalId);
          if (goal) {
            goal.deleteAttempt(this.resultId, this._storageService.getBank().results);
          }
        }
        this.currentResult!.goals = new Set(goals.map((g) => g.id));
        this._storageService.storeAttempt(this.currentResult!);
        this._snackbarService.showEmoji('🔗', 'Updated linked goals successfully.', 3000);
        this.loadRelatedGoals();
      }
    });
  }
} 