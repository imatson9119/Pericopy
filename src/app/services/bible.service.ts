import { Injectable } from '@angular/core';
import bibleFile from 'src/assets/bible-esv-min.json';
import wordMapFile from 'src/assets/word_map.json';
import {
  IBible,
  BibleDiffNew,
  Book,
  BookDiff,
  Chapter,
  ChapterDiff,
  DiffType,
  Verse,
  VerseDiff,
  WordChange,
  WordMap,
  WordMapFile,
} from '../classes/models';
import { diffWords } from 'diff';
import { getWordChange, sanitizeText } from 'src/app/utils/utils';
import { BibleIterator } from '../classes/BibleIterator';
import { Bible } from '../classes/Bible';

@Injectable({
  providedIn: 'root',
})
export class BibleService {
  bible: Bible;
  wordMap: WordMap = {};

  constructor() {
    for (let word in wordMapFile) {
      this.wordMap[word] = new Set((wordMapFile as WordMapFile)[word]);
    }
    this.bible = new Bible(bibleFile as IBible, this.wordMap);
  }

  findAchors(attempt: string): number[] | undefined {
    console.log(this.bible.anchorText(attempt))
    // Remove non-word characters and split the attempt into words
    let words: string[] = attempt
      .replace(/[^\w ]/g, '')
      .toLowerCase()
      .split(/\s+/);
    let start = this.anchor(words);
    let end = this.anchor(words.reverse(), true, start);
    if (start == -1 || end == -1 || start > end) {
      console.log('No anchors found: ' + start + ' ' + end);
      return undefined;
    }
    return [start, end + 1];
  }

  anchor(
    words: string[],
    reversed: boolean = false,
    startAnchorLoc: number = -1
  ): number {
    // This function will attempt to find the start of the user's attempt in the Bible
    // It will accomplish this by finding the first unique valid sequence of words in the attempt using wordMap
    // If no such sequence is found, it will return -1

    let start: number = 0;
    let end: number = 0;
    let possibleStartLocs = new Set<number>();

    while (end < words.length) {
      let curWord = words[end];
      if (this.wordMap[curWord]) {
        // If the current word is in the wordMap, we need to check if it is a valid start
        if (possibleStartLocs.size == 0) {
          // If there are no possible start locations, we need to add the current word's locations to the set
          possibleStartLocs = new Set(this.wordMap[curWord]);
        } else {
          // If there are possible start locations, we need to find the intersection of the current word's locations and the possible start locations
          let possibleWordLocs = new Set(this.wordMap[curWord]);
          possibleStartLocs.forEach((loc) => {
            if (reversed) {
              if (!possibleWordLocs.has(loc - end + start)) {
                possibleStartLocs.delete(loc);
              }
            } else {
              if (!possibleWordLocs.has(loc + end - start)) {
                possibleStartLocs.delete(loc);
              }
            }
          });
        }
        if (possibleStartLocs.size == 1) {
          let val = Array.from(possibleStartLocs)[0];
          if (startAnchorLoc != -1 && val - startAnchorLoc > 2 * words.length) {
            start += 1;
            end = start;
            possibleStartLocs.clear();
          } else {
            // If there is only one possible start location, we have found the start of the attempt
            return Array.from(possibleStartLocs)[0];
          }
        } else if (possibleStartLocs.size > 0) {
          // If there are still possible start locations, we need to move the end pointer to the next word
          end += 1;
        } else {
          // If there are no possible start locations, we need to drop the first word
          start += 1;
          end = start;
          possibleStartLocs.clear();
        }
      } else {
        // If the current word is not in the wordMap, we need to move the start and end pointers to the next word
        end += 1;
        start = end;
        possibleStartLocs.clear();
      }
    }
    console.log(possibleStartLocs);
    return -1;
  }

  getPassageTitle(start_loc: number, end_loc: number): string {
    return this.bible.getPassage(start_loc, end_loc).toString();
  }

  getBibleDiff(
    attempt: string,
    start_loc: number,
    end_loc: number
  ): BibleDiffNew | undefined {
    if (start_loc < 0 || end_loc < 0 || start_loc > end_loc) {
      return undefined;
    }
    let scripture = this.bible.getText(start_loc, end_loc);
    if (!scripture) {
      console.log('Error getting text');
      return undefined;
    }
    let diff: WordChange[] = getWordChange(
      diffWords(sanitizeText(scripture), sanitizeText(attempt), {
        ignoreCase: true,
        ignoreWhitespace: true,
      })
    );
    console.log('Word diff');
    console.log(diff);
    let scripture_arr = scripture.split(' ');
    let attempt_arr = attempt.split(' ');
    let scripture_index = 0;
    let attempt_index = 0;
    let diff_index = 0;
    let change_index = 0;
    let cur_loc = start_loc;
    let done = false;
    let bibleDiff: BibleDiffNew = {
      m: this.bible.m,
      p: this.getPassageTitle(start_loc, end_loc) || '',
      i: start_loc,
      j: end_loc,
      v: [],
    };

    for (let book of this.bible.v) {
      if (cur_loc < book.m.i + book.m.l && !done) {
        let bookDiff: BookDiff = {
          m: book.m,
          v: [],
        };
        for (let chapter of book.v) {
          if (cur_loc < chapter.m.i + chapter.m.l && !done) {
            let chapterDiff: ChapterDiff = {
              m: chapter.m,
              v: [],
            };
            for (let verse of chapter.v) {
              if (cur_loc < verse.m.i + verse.m.l && !done) {
                let verseDiff: VerseDiff = {
                  m: verse.m,
                  v: [],
                };
                while (
                  cur_loc < verse.m.i + verse.m.l &&
                  diff_index < diff.length &&
                  change_index < diff[diff_index].v.length
                ) {
                  let diffType = diff[diff_index].t;
                  if (
                    verseDiff.v.length == 0 ||
                    diffType != verseDiff.v[verseDiff.v.length - 1].t
                  ) {
                    verseDiff.v.push({
                      t: diffType,
                      v: [],
                    });
                  }
                  if (diffType == DiffType.Added) {
                    verseDiff.v[verseDiff.v.length - 1].v.push(
                      attempt_arr[attempt_index]
                    );
                    attempt_index += 1;
                  } else if (diffType == DiffType.Removed) {
                    verseDiff.v[verseDiff.v.length - 1].v.push(
                      scripture_arr[scripture_index]
                    );
                    scripture_index += 1;
                    cur_loc += 1;
                  } else {
                    verseDiff.v[verseDiff.v.length - 1].v.push(
                      scripture_arr[scripture_index]
                    );
                    attempt_index += 1;
                    scripture_index += 1;
                    cur_loc += 1;
                  }
                  change_index += 1;
                  if (change_index == diff[diff_index].v.length) {
                    change_index = 0;
                    diff_index += 1;
                  }
                  if (diff_index == diff.length) {
                    done = true;
                    break;
                  }
                }
                chapterDiff.v.push(verseDiff);
              }
            }
            bookDiff.v.push(chapterDiff);
          }
        }
        bibleDiff.v.push(bookDiff);
      }
    }
    return bibleDiff;
  }
}
