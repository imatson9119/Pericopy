import { Component, OnDestroy } from '@angular/core';
import { StorageService } from './services/storage.service';
import { BibleService } from './services/bible.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'roman-road-webapp';
  bibleVersion: string = localStorage.getItem('bibleVersion') || 'esv';
  supportedVersions = this._bibleService.getSupportedVersions();

  constructor(private _storageService: StorageService, private _bibleService: BibleService) {
    this.setBibleVersion(this.bibleVersion);
  }
  
  getAttempts() {
    return this._storageService.getAttempts();
  }

  setBibleVersion(version: string) {
    this.bibleVersion = version;
    this._bibleService.setVersion(version).subscribe(
      (bible) => {
        localStorage.setItem('bibleVersion', version);
      }
    );
  }
}