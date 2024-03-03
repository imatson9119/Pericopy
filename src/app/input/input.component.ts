import { Component } from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { Change, diffWords } from 'diff'
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
    let diff: Change[] = diffWords("", this.attempt, {"ignoreCase": true, "ignoreWhitespace": true});
    this._storageService.store_attempt(diff);
    this.router.navigateByUrl('results');
  }

  findAnchors() {
    let anchors = this._bibleService.findAchors(this.attempt);
    console.log("Found anchors: " + anchors);
    if(anchors){
      console.log(this._bibleService.getText(anchors[0], anchors[1]));
    }

  }


}
