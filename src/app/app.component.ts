import { Component, inject } from '@angular/core';
import { StorageService } from './services/storage.service';
import { BibleService } from './services/bible.service';
import { MatDialog } from '@angular/material/dialog';
import { NewUserDialogComponent } from './misc-components/new-user-dialog/new-user-dialog.component';
import { UpdateDialogComponent } from './misc-components/update-dialog/update-dialog.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [
      MatToolbarModule,
      MatIconModule,
      MatButtonModule,
      MatMenuModule,
      MatDividerModule,
      RouterModule
    ]
})
export class AppComponent {
  title = 'roman-road-webapp';
  private _bibleService = inject(BibleService);
  private _storageService = inject(StorageService);
  private dialog = inject(MatDialog);
  supportedVersions = this._bibleService.getSupportedVersions();

  constructor() {
    this.handleDialogs();
  }
  
  getAttempts() {
    return this._storageService.getAttempts();
  }

  setBibleVersion(version: string) {
    this._bibleService.version.set(version);
  }

  getBibleVersion() {
    return this._bibleService.version().toUpperCase();
  }

  handleDialogs() {
    if (this._storageService.isNewUser()) {
      this.dialog.open(NewUserDialogComponent, {
        width: '500px',
      });
      this._storageService.setNotNewUser();
      this._storageService.setClientToUpdatedVersion();
    } else if (this._storageService.isNewVersion()) {
      this.dialog.open(UpdateDialogComponent, {
        width: '500px',
      });
      this._storageService.setClientToUpdatedVersion();
    }
  }
}