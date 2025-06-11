import { Injectable, signal, resource, inject, effect, computed } from '@angular/core';
import {
  IBible,
  WordMap,
  WordMapFile,
} from '../classes/models';
import { Bible } from '../classes/Bible';
import { BehaviorSubject, Observable, map, of, shareReplay, zip } from 'rxjs';
import { HttpClient, httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BibleService {

  version = signal<string>(localStorage.getItem('bibleVersion') || 'esv');
  bibleUrl = 'https://imatson9119.github.io/bible-parser';
  wordMapFile = httpResource<WordMap>(
    () => ({  url: `${this.bibleUrl}/word_maps/${this.version()}.json` }),
    { parse: this.wordMapParser }
  )
  bibleFile = httpResource<IBible>(
    () => ({  url: `${this.bibleUrl}/bibles/${this.version()}.json` }),
  )
  bible = computed<Bible | undefined>(() => {
    let wordMap = this.wordMapFile.value();
    let bible = this.bibleFile.value();
    if (wordMap !== undefined && bible !== undefined) {
      return new Bible(bible, wordMap);
    }
    return undefined;
  })

  private bibles: { [key: string]: Bible | undefined | Observable<Bible>} = {
    esv: undefined,
    kjv: undefined,
    nasb: undefined,
    net: undefined,
    nirv: undefined,
    niv: undefined,
    nkjv: undefined,
    nlt: undefined,
    nrsv: undefined,
  };

  private bibleEffect = effect(() => {
    console.log(`bible: ${this.bible()}`);
  })

  private http = inject(HttpClient);

  constructor() {}

  getSupportedVersions(): string[] {
    return Object.keys(this.bibles);
  }

  wordMapParser(wordMap: unknown): WordMap {
    let wordMapFile = wordMap as WordMapFile;
    let wordMapObj: WordMap = {};
    for (let word in wordMapFile) {
      wordMapObj[word] = new Set(wordMapFile[word]);
    }
    return wordMapObj;
  }
}
