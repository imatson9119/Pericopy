import { Injectable } from '@angular/core';
import {
  IBible,
  WordMap,
  WordMapFile,
} from '../classes/models';
import { Bible } from '../classes/Bible';
import { BehaviorSubject, Observable, map, of, shareReplay, zip } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BibleService {
  bibleUrl = 'https://imatson9119.github.io/bible-parser';
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
  curVersion = '';
  private curBibleSubject: BehaviorSubject<Bible | undefined> = new BehaviorSubject<Bible | undefined>(undefined);
  _curBible = this.curBibleSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  get curBible(): Observable<Bible | undefined>{
    return this._curBible;
  }

  getSupportedVersions(): string[] {
    return Object.keys(this.bibles);
  }

  setVersion(version: string): Observable<boolean> {
    if (version === this.curVersion) {
      return of(true);
    }
    let requestedBible = this.bibles[version];
    if (requestedBible === undefined) {
      let loadObservable = this.getBible(version);
      loadObservable.subscribe((bible) => {
        if (bible === undefined) {
          return;
        }
        this.curVersion = version;
        this.curBibleSubject.next(bible);
      });
      return loadObservable.pipe(map((bible) => {
        return bible !== undefined;
      }));
    } else if (requestedBible instanceof Bible){
      this.curVersion = version;
      this.curBibleSubject.next(requestedBible);
      return of(true);
    } else {
      requestedBible.subscribe((bible) => {
        if (bible === undefined) {
          return;
        }
        this.curVersion = version;
        this.curBibleSubject.next(bible);
      });
      return requestedBible.pipe(map((bible) => {
        return bible !== undefined;
      })); 
    }
  }

  loadBible(version: string): Observable<Bible> {
    let bible = this.http.get<any>(`${this.bibleUrl}/bibles/${version}.json`);
    let wordMap = this.http.get<any>(`${this.bibleUrl}/word_maps/${version}.json`);
    let observable = zip(bible, wordMap).pipe(
      map(([bible, wordMap]) => {
        let wordMapFile = wordMap as WordMapFile;
        let wordMapObj: WordMap = {};
        for (let word in wordMapFile) {
          wordMapObj[word] = new Set(wordMapFile[word]);
        }
        let bibleObj = new Bible(bible as IBible, wordMapObj);
        this.bibles[version] = bibleObj;
        this.curBibleSubject.next(bibleObj);
        return bibleObj;
      }),
      shareReplay(1)
    );
    this.bibles[version] = observable;
    return observable;
  }

  getBible(version: string): Observable<Bible> {
    let bible = this.bibles[version];
    return bible instanceof Bible ? of(bible) : bible instanceof Observable ? bible : this.loadBible(version);
  }
}
