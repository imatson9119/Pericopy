import { Component, OnDestroy } from '@angular/core';
import { StorageService } from './services/storage.service';
import { BibleService } from './services/bible.service';
import { MatDialog } from '@angular/material/dialog';
import { NewUserDialogComponent } from './misc-components/new-user-dialog/new-user-dialog.component';
import { UpdateDialogComponent } from './misc-components/update-dialog/update-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'roman-road-webapp';
  bibleVersion: string = localStorage.getItem('bibleVersion') || 'esv';
  supportedVersions = this._bibleService.getSupportedVersions();

  constructor(private _storageService: StorageService, private _bibleService: BibleService, private dialog: MatDialog) {
    this.setBibleVersion(this.bibleVersion);
    this.handleDialogs();
  }
  
  getAttempts() {
    return this._storageService.getAttempts();
  }

  setBibleVersion(version: string) {
    this.bibleVersion = version;
    this._bibleService.setVersion(version).subscribe(
      (bible) => {
        if (bible) {
          localStorage.setItem('bibleVersion', version);
        }
      }
    );
  }

  handleDialogs() {
    if (this._storageService.isNewUser()) {
      this.dialog.open(NewUserDialogComponent, {
        width: '500px',
      });
      this._storageService.setNotNewUser();
    } else if (this._storageService.isNewVersion()) {
      this.dialog.open(UpdateDialogComponent, {
        width: '500px',
      });
      this._storageService.setClientToUpdatedVersion();
    }
  }
}