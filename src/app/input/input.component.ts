import { Component } from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { Change, diffWords } from 'diff'
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';
import { BibleService } from '../services/bible.service';
import { BibleChange } from '../models/models';

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
    let scripture = this._bibleService.getText(anchors[0], anchors[1]);
    if (!scripture){
      console.log("Error getting text")
      return;
    }

    let diff = this.getBibleDiff(this.attempt, scripture); 
    this._storageService.storeAttempt(diff);
    this.router.navigateByUrl('results');
  }

  findAnchors() {
    let anchors = this._bibleService.findAchors(this.attempt);
    console.log("Found anchors: " + anchors);
    if(anchors){
      console.log(this._bibleService.getText(anchors[0], anchors[1]));
    }

  }

  getBibleDiff(attempt: string, scripture:string): BibleChange[] {
    let diff: Change[] = diffWords(
      this._bibleService.sanitizeText(scripture),
      this._bibleService.sanitizeText(attempt),
      {
        "ignoreCase": true,
        "ignoreWhitespace": true
      }
    );
    let bibleDiff: BibleChange[] = [];
    for (let change of diff){
      bibleDiff.push({
        "added": Object.hasOwn(change, "added"),
        "removed": Object.hasOwn(change, "removed"),
        "value": change.value.split(" ")
      });
    }
    return bibleDiff;
  }
}
