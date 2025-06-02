import { Injectable, ComponentRef, ViewContainerRef, Injector } from '@angular/core';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { SnackbarComponent } from '../misc-components/snackbar/snackbar.component';

export interface SnackbarConfig {
  message: string;
  duration?: number;
  type?: 'success' | 'info' | 'warning' | 'error' | 'emoji';
  dismissible?: boolean;
  emoji?: string;
}

interface ActiveSnackbar {
  overlayRef: OverlayRef;
  componentRef: ComponentRef<SnackbarComponent>;
}

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private activeSnackbars: ActiveSnackbar[] = [];

  constructor(
    private overlay: Overlay,
    private injector: Injector
  ) {}

  /**
   * Show a success snackbar with green check icon
   */
  showSuccess(message: string, duration: number = 4000, dismissible: boolean = true): void {
    this.show({
      message,
      duration,
      type: 'success',
      dismissible: true
    });
  }

  /**
   * Show an info snackbar
   */
  showInfo(message: string, duration: number = 4000, dismissible: boolean = true): void {
    this.show({
      message,
      duration,
      type: 'info',
      dismissible
    });
  }

  /**
   * Show a warning snackbar
   */
  showWarning(message: string, duration: number = 5000, dismissible: boolean = true): void {
    this.show({
      message,
      duration,
      type: 'warning',
      dismissible
    });
  }

  showEmoji(message: string, emoji: string, duration: number = 5000, dismissible: boolean = true): void {
    this.show({
      message,
      duration,
      type: 'emoji',
      emoji,
      dismissible
    });
  }

  /**
   * Show an error snackbar
   */
  showError(message: string, duration: number = 6000, dismissible: boolean = true): void {
    this.show({
      message,
      duration,
      type: 'error',
      dismissible
    });
  }

  /**
   * Show a custom snackbar with full configuration
   */
  show(config: SnackbarConfig): void {
    // Limit the number of active snackbars
    if (this.activeSnackbars.length >= 3) {
      this.dismissOldest();
    }

    const overlayRef = this.createOverlay();
    const snackbarRef = this.attachSnackbarContainer(overlayRef, config);

    const activeSnackbar: ActiveSnackbar = {
      overlayRef,
      componentRef: snackbarRef
    };

    this.activeSnackbars.push(activeSnackbar);

    // Auto-dismiss after specified duration
    if (config.duration && config.duration > 0) {
      setTimeout(() => {
        this.dismissWithAnimation(activeSnackbar);
      }, config.duration);
    }

    // Handle dismiss on click if dismissible
    if (config.dismissible) {
      snackbarRef.instance.dismissed.subscribe(() => {
        this.finalizeDisposal(activeSnackbar);
      });
    }
  }

  /**
   * Dismiss all active snackbars
   */
  dismissAll(): void {
    // Create a copy of the array to avoid issues with concurrent modifications
    const snackbarsCopy = [...this.activeSnackbars];
    snackbarsCopy.forEach(activeSnackbar => {
      this.dismissWithAnimation(activeSnackbar);
    });
  }

  private createOverlay(): OverlayRef {
    const positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally()
      .bottom('20px');

    const overlayConfig = new OverlayConfig({
      positionStrategy,
      hasBackdrop: false,
      panelClass: 'snackbar-overlay-panel'
    });

    return this.overlay.create(overlayConfig);
  }

  private attachSnackbarContainer(
    overlayRef: OverlayRef,
    config: SnackbarConfig
  ): ComponentRef<SnackbarComponent> {
    const portal = new ComponentPortal(SnackbarComponent, null, this.createInjector(config));
    const containerRef = overlayRef.attach(portal);

    return containerRef;
  }

  private createInjector(config: SnackbarConfig): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: 'snackbarConfig', useValue: config }
      ]
    });
  }

  private dismissWithAnimation(activeSnackbar: ActiveSnackbar): void {
    if (activeSnackbar.componentRef && activeSnackbar.componentRef.instance) {
      activeSnackbar.componentRef.instance.startExitAnimation();
    }
  }

  private finalizeDisposal(activeSnackbar: ActiveSnackbar): void {
    const index = this.activeSnackbars.findIndex(s => s === activeSnackbar);
    if (index > -1) {
      this.activeSnackbars.splice(index, 1);
      activeSnackbar.overlayRef.dispose();
    }
  }

  private dismissOldest(): void {
    if (this.activeSnackbars.length > 0) {
      const oldest = this.activeSnackbars[0];
      this.dismissWithAnimation(oldest);
    }
  }
} 