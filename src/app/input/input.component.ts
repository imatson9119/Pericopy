import { Component } from '@angular/core';
// https://github.com/kpdecker/jsdiff
import { Change, diffWords } from 'diff'
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';
import { BibleService } from '../services/bible.service';
import { BibleChange, BibleDiff, BibleDiffNew } from '../models/models';
import { sanitizeText } from 'src/utils';

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

    let diff = this.getBibleDiff(this.attempt, scripture, anchors); 
    this._storageService.storeAttempt(diff);
    this.router.navigateByUrl('results');
  }

  test() {
    let text = "the world, and the world was made through him, yet the world did not know him. He came to his own, and his own people did not receive him. But to all who did receive him, who believed in his name, he gave the right to become children of God, who were born, not of blood nor of the will of the flesh nor of the will of man, but of God. And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth. (John bore witness about him, and cried out,"
    let anchors = this._bibleService.findAchors(text);
    if (!anchors){
      return;
    }
    return this._bibleService.getText(anchors[0], anchors[1]);

  }


  getBibleDiff(attempt: string, scripture: string, anchors: number[]): BibleDiff {
    let test = this._bibleService.getBibleDiff(attempt, anchors[0], anchors[1])
    console.log("DIFF")
    console.log(test)
    let diff: Change[] = diffWords(
      sanitizeText(scripture),
      sanitizeText(attempt),
      {
        "ignoreCase": true,
        "ignoreWhitespace": true
      }
    );

    let scripture_arr = scripture.split(" ");
    let attempt_arr = attempt.split(" ");
    let scripture_index = 0;
    let attempt_index = 0;

    console.log(diff)
    let bibleDiff: BibleChange[] = [];
    for (let change of diff){
      let added = Object.hasOwn(change, "added") && change.added !== undefined;
      let removed = Object.hasOwn(change, "removed") && change.removed !== undefined;
      let sanitizedText = sanitizeText(change.value);
      if (sanitizedText === ""){
        continue;
      }
      let change_len = sanitizedText.split(" ").length;
      let value = [];
      if(added){
        value = attempt_arr.slice(attempt_index, attempt_index + change_len);
        attempt_index += change_len;
      } else if (removed){
        value = scripture_arr.slice(scripture_index, scripture_index + change_len);
        scripture_index += change_len;
      } else {
        value = scripture_arr.slice(scripture_index, scripture_index + change_len);
        attempt_index += change_len;
        scripture_index += change_len;
      
      }
      bibleDiff.push({
        "added": added,
        "removed": removed,
        "value": value,
      });
    }
    let title = this._bibleService.getPassageTitle(anchors[0], anchors[1]);

    return {
      "diff": bibleDiff,
      "start_loc": anchors[0],
      "end_loc": anchors[1],
      "title": title ? title : "Unknown"
    };
  }
}
