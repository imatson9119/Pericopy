import { BibleDiffNew, DiffType, IResult } from './models';

class Result implements IResult {
  diff: BibleDiffNew;
  timestamp: number;
  score: number;

  constructor(result: IResult) {
    this.diff = result.diff;
    this.timestamp = result.timestamp;
    this.score = result.score;
  }

  getAttemptName() {
    return this.diff.p;
  }

  getAttemptText(): string {
    let text = '';
    for (let book of this.diff.v) {
      for (let chapter of book.v) {
        for (let verse of chapter.v) {
          for (let diff of verse.v) {
            if(diff.t === DiffType.Added || diff.t === DiffType.Unchanged) {
              text += diff.v.join(' ') + ' ';
            }
          }
        }
      }
    }
    return text;
  }

  getAttemptScripture(): string {
    let text = '';
    for (let book of this.diff.v) {
      for (let chapter of book.v) {
        for (let verse of chapter.v) {
          for (let diff of verse.v) {
            if(diff.t === DiffType.Removed || diff.t === DiffType.Unchanged) {
              text += diff.v.join(' ') + ' ';
            }
          }
        }
      }
    }
    return text;  
  }
}
