import { BibleMetadata, BibleWord, Book, IBible, WordMap, AnchorType } from './models';
import { BiblePassage } from './BiblePassage';
import { BibleIterator } from './BibleIterator';
import { BibleReference } from './BibleReference';
import { addToMapValue } from '../utils/utils';

export class Bible implements IBible {
  m: BibleMetadata;
  v: Book[];
  wordMap: WordMap;

  ANCHOR_MAX_CERTAIN_LOCKS = 1;
  ANCHOR_SIGNIFICANCE_THRESHOLD = 10;
  ANCHOR_RETURN_NUMBER = 10;

  constructor(bible: IBible, wordMap: WordMap) {
    this.m = bible.m;
    this.v = bible.v;
    this.wordMap = wordMap;
  }

  get(index: number): BibleWord {
    if (index < 0 || index >= this.m.l) {
      throw new Error('Invalid index');
    }
    for (let book of this.v) {
      if (index < book.m.i + book.m.l) {
        for (let chapter of book.v) {
          if (index < chapter.m.i + chapter.m.l) {
            for (let verse of chapter.v) {
              if (index < verse.m.i + verse.m.l) {
                return {
                  word: verse.v[index - verse.m.i],
                  index: index,
                  book: book,
                  chapter: chapter,
                  verse: verse,
                };
              }
            }
          }
        }
      }
    }
    throw new Error('Index not found');
  }

  getReference(index: number): BibleReference {
    let word = this.get(index);
    return new BibleReference(word.book.m.b, word.chapter.m.c, word.verse.m.v); 
  }

  getPassage(i: number, j: number): BiblePassage {
    if (i < 0 || j < 0 || i > j || i >= this.m.l) {
      throw new Error('Invalid indices');
    }
    let start = this.get(i);
    let end = this.get(j);
    return new BiblePassage(i, j, start.book.m.b, start.chapter.m.c, start.verse.m.v, end.book.m.b, end.chapter.m.c, end.verse.m.v);
  }

  getText(start_loc: number, end_loc: number): string {
    let bible: BibleIterator = new BibleIterator(this, start_loc, end_loc);
    let text = '';
    for (let word of bible) {
      text += word.word + ' ';
    }
    return text.trim();
  }

  anchorText(text: string): [BiblePassage, number][] {
    let words =  text.trim().replace(/[^\w ]/g, "").toLowerCase().split(/\s+/);
    let startAnchors = this._getBibleAnchors(words, AnchorType.START);
    let result: [BiblePassage, number][] = []
    if (startAnchors.length === 0) {
      return result;
    }
    let endAnchors = this._getBibleAnchors(words, AnchorType.END);
    if (endAnchors.length === 0) {
      return result;
    }

    return this._getPassagesFromAnchors(startAnchors, endAnchors);
  }

  _getPassagesFromAnchors(startAnchors: [number, number][], endAnchors: [number, number][]): [BiblePassage, number][] {
    let result: [BiblePassage, number][] = [];
    console.log(startAnchors);
    console.log(endAnchors);
    for (let startAnchor of startAnchors) {
      for (let endAnchor of endAnchors) {
        if (startAnchor[0] >= endAnchor[0]) {
          continue;
        }
        console.log(startAnchor[0], endAnchor[0])
        let passage = this.getPassage(startAnchor[0], endAnchor[0]);
        let score = startAnchor[1] * endAnchor[1];
        result.push([passage, score]);
      }
    }
    return result.sort((a, b) => b[1] - a[1]).slice(0, this.ANCHOR_RETURN_NUMBER);
  }

  _getBibleAnchors(words: string[], type: AnchorType): [number, number][]{
    /**
     * This function calculates likely starting or ending locations in the Bible for a given sequence of words.
     * An anchor sequence is a sequence that is used to locate a starting index in the Bible.
     *
     * @param words - An array of words for which to calculate anchor probabilities.
     * @param type - The type of anchor (start or end) to calculate probabilities for.
     *
     * @returns An array of tuples, where each tuple contains a sequence's potential starting or ending location in the Bible and its anchor probability.
     * The array is sorted in descending order of anchor probabilities.
     */
    let direction = type === AnchorType.START ? 1 : -1;
    let start = type === AnchorType.START ? 0 : words.length - 1;
    let nCertainLocks = 0;
    // List of anchor probabilities. Index i contains a list of probabilities for the anchor at index i
    // The format of the probabilities is [index, probability]
    let anchorProbabilities: [number, number][][] = []; 
    for (let i = start; i < words.length && i >= 0; i += direction) {
      if (this.wordMap[words[i]]) {
        anchorProbabilities.push(this._getBibleAnchorProbabilities(words, type, i));
        if (anchorProbabilities[anchorProbabilities.length - 1].length !== 0 && anchorProbabilities[anchorProbabilities.length - 1][0][1] === 1) {
          nCertainLocks++;
          if (nCertainLocks === this.ANCHOR_MAX_CERTAIN_LOCKS) {
            break;
          }
        }
      }
    }
    // Combine and sort the anchor probabilities
    let combinedAnchorProbabilities: [number, number][] = [];
    for (let anchorProbability of anchorProbabilities) {
      combinedAnchorProbabilities = combinedAnchorProbabilities.concat(anchorProbability);
    }
    return combinedAnchorProbabilities.sort((a, b) => b[1] - a[1]).slice(0, this.ANCHOR_RETURN_NUMBER);
  }


  _getBibleAnchorProbabilities(words: string[], type: AnchorType, start: number): [number, number][] {
    /**
     * This function calculates the probabilities of particular sequence being an anchor sequence.
     * An anchor sequence is a sequence that is used to locate a starting index in the Bible.
     *
     * @param words - An array of words for which to calculate anchor probabilities.
     * @param type - The type of anchor (start or end) to calculate probabilities for.
     * @param start - The index in the words array from which to start calculating probabilities.
     *
     * @returns A sorted array of tuples, where each tuple contains a sequence's potential starting or ending location in the Bible and its anchor probability.
     * The array is sorted in descending order of anchor probabilities.
     */

    let direction = type === AnchorType.START ? 1 : -1;
    let anchorProbabilities = new Map<number, number>(); 
    if(this.wordMap[words[start]]){
      let possibleAnchors = [...this.wordMap[words[start]]];
      for (let i = start + direction; i < words.length && i >= 0; i += direction) {
        let nextLocs = this.wordMap[words[i]] ? this.wordMap[words[i]] : new Set([]);
        let offset = Math.abs(i - start) * direction;
        let possibleAnchorsStartSize = possibleAnchors.length;
        let newPossibleAnchors = [...possibleAnchors].filter(x => {
          let shouldKeep = nextLocs.has(x + offset);
          if(!shouldKeep && possibleAnchorsStartSize <= this.ANCHOR_SIGNIFICANCE_THRESHOLD){
            addToMapValue(anchorProbabilities, x, 1 / possibleAnchorsStartSize);
          }
          return shouldKeep;
        });
        possibleAnchors = newPossibleAnchors;
        if (possibleAnchors.length === 0) {
          return [...anchorProbabilities.entries()].sort((a, b) => b[1] - a[1]);
        } else if(possibleAnchors.length === 1){
          break;
        }
      }
      if (possibleAnchors.length <= this.ANCHOR_SIGNIFICANCE_THRESHOLD){
        for (let loc of possibleAnchors) {
          addToMapValue(anchorProbabilities, loc, 1 / possibleAnchors.length);
        }
      }
    }
    return [...anchorProbabilities.entries()].sort((a, b) => b[1] - a[1]);
  }
}
