import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface SnackbarConfig {
  message: string;
  duration?: number;
  type?: 'success' | 'info' | 'warning' | 'error' | 'emoji';
  dismissible?: boolean;
  emoji?: string;
}

@Component({
    selector: 'app-snackbar',
    templateUrl: './snackbar.component.html',
    styleUrls: ['./snackbar.component.scss'],
    animations: [
        trigger('slideIn', [
            state('in', style({
                transform: 'translateY(0) scale(1)',
                opacity: 1
            })),
            state('out', style({
                transform: 'translateY(100%) scale(0.95)',
                opacity: 0
            })),
            transition('void => in', [
                style({
                    transform: 'translateY(100%) scale(0.95)',
                    opacity: 0
                }),
                animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
                    transform: 'translateY(0) scale(1)',
                    opacity: 1
                }))
            ]),
            transition('in => out', [
                animate('250ms cubic-bezier(0.4, 0.0, 0.6, 1)', style({
                    transform: 'translateY(100%) scale(0.95)',
                    opacity: 0
                }))
            ])
        ])
    ],
    imports: [MatIconModule, CommonModule]
})
export class SnackbarComponent implements OnInit {
  @Output() dismissed = new EventEmitter<void>();
  @Output() animationDone = new EventEmitter<void>();

  animationState = 'in';

  constructor(
    @Inject('snackbarConfig') public config: SnackbarConfig
  ) {}

  ngOnInit(): void {
    // Set default values if not provided
    this.config = {
      type: 'success',
      dismissible: true,
      ...this.config
    };
  }

  /**
   * Handle click to dismiss snackbar
   */
  onDismiss(): void {
    if (this.config.dismissible) {
      this.startExitAnimation();
    }
  }

  /**
   * Start the exit animation
   */
  startExitAnimation(): void {
    this.animationState = 'out';
  }

  /**
   * Handle animation events
   */
  onAnimationDone(event: any): void {
    if (event.toState === 'out') {
      this.dismissed.emit();
      this.animationDone.emit();
    }
  }

  /**
   * Get the appropriate icon for the snackbar type
   */
  getIcon(): string {
    switch (this.config.type) {
      case 'success':
        return 'check_circle_outline';
      case 'info':
        return 'info_outline';
      case 'warning':
        return 'warning_outline';
      case 'error':
        return 'error_outline';
      default:
        return 'check_circle_outline';
    }
  }

  /**
   * Get the CSS class for the snackbar type
   */
  getTypeClass(): string {
    return `snackbar--${this.config.type || 'success'}`;
  }
} 