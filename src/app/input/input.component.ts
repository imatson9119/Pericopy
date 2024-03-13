import { Component } from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';
import { BibleService } from '../services/bible.service';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent {
  attempt = ""

  constructor(private _storageService: StorageService, private _bibleService: BibleService, private router: Router){}

  submit() {
    let anchors = this._bibleService.findAchors(this.attempt);
    if (!anchors){
      console.log("No anchors found");
      return;
    }
    let diff = this._bibleService.getBibleDiff(this.attempt, anchors[0], anchors[1])
    if (!diff){
      throw new Error("Error getting diff")
    }
    this._storageService.storeAttempt(diff);
    this.router.navigateByUrl('results');
  }
}
