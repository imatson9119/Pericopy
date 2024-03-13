import { Injectable } from '@angular/core';
import bibleFile from 'src/assets/bible-esv-min.json'
import wordMapFile from 'src/assets/word_map.json'
import { BibleM, BookM, ChapterM, VerseM, WordMap, WordMapFile } from '../models/models';



@Injectable({
  providedIn: 'root'
})

export class BibleService {

  bookIndices = {"genesis": 0, "exodus": 1, "leviticus": 2, "numbers": 3, "deuteronomy": 4, "joshua": 5, "judges": 6, "ruth": 7, "1 samuel": 8, "2 samuel": 9, "1 kings": 10, "2 kings": 11, "1 chronicles": 12, "2 chronicles": 13, "ezra": 14, "nehemiah": 15, "esther": 16, "job": 17, "psalm": 18, "proverbs": 19, "ecclesiastes": 20, "song of solomon": 21, "isaiah": 22, "jeremiah": 23, "lamentations": 24, "ezekiel": 25, "daniel": 26, "hosea": 27, "joel": 28, "amos": 29, "obadiah": 30, "jonah": 31, "micah": 32, "nahum": 33, "habakkuk": 34, "zephaniah": 35, "haggai": 36, "zechariah": 37, "malachi": 38, "matthew": 39, "mark": 40, "luke": 41, "john": 42, "acts": 43, "romans": 44, "1 corinthians": 45, "2 corinthians": 46, "galatians": 47, "ephesians": 48, "philippians": 49, "colossians": 50, "1 thessalonians": 51, "2 thessalonians": 52, "1 timothy": 53, "2 timothy": 54, "titus": 55, "philemon": 56, "hebrews": 57, "james": 58, "1 peter": 59, "2 peter": 60, "1 john": 61, "2 john": 62, "3 john": 63, "jude": 64, "revelation": 65}
  bible = bibleFile as BibleM
  wordMap: WordMap = {}

  constructor() { 
    for (let word in wordMapFile){
      this.wordMap[word] = new Set((wordMapFile as WordMapFile)[word]);
    }
  }

  sanitizeText(text: string): string{
    return text.trim().replace(/[^\w ]/g, "").toLowerCase().split(/\s+/).join(" ");
  }


  findAchors(attempt: string): number[] | undefined{
    // Remove non-word characters and split the attempt into words
    let words: string[] = attempt.replace(/[^\w ]/g, "").toLowerCase().split(/\s+/);
    let start = this.anchor(words);
    let end = this.anchor(words.reverse(), true, start);
    if (start == -1 || end == -1 || start > end){ 
      return undefined;
    }
    return [start, end+1];
  }
  
  anchor(words: string[], reversed: boolean = false, startAnchorLoc: number = -1, ): number{
    // This function will attempt to find the start of the user's attempt in the Bible
    // It will accomplish this by finding the first unique valid sequence of words in the attempt using wordMap
    // If no such sequence is found, it will return -1

    let start: number = 0;
    let end: number = 0;
    let possibleStartLocs = new Set<number>();

    while(end < words.length){
      let curWord = words[end];
      if(this.wordMap[curWord]){
        // If the current word is in the wordMap, we need to check if it is a valid start
        if (possibleStartLocs.size == 0){
          // If there are no possible start locations, we need to add the current word's locations to the set
          possibleStartLocs = new Set(this.wordMap[curWord]);
          console.log("Starting consideration with word" + curWord)
        } else {
          // If there are possible start locations, we need to find the intersection of the current word's locations and the possible start locations
          let possibleWordLocs = new Set(this.wordMap[curWord]);
          possibleStartLocs.forEach((loc) => {
            if (reversed){
              if (!possibleWordLocs.has(loc - end + start)){
                possibleStartLocs.delete(loc);
              }
            } else {
              if (!possibleWordLocs.has(loc + end - start)){
                possibleStartLocs.delete(loc);
              }
            }
          });
        }
        if (possibleStartLocs.size == 1){
          let val = Array.from(possibleStartLocs)[0];
          if (startAnchorLoc != -1 && val - startAnchorLoc > 2*words.length){
            start += 1;
            end = start;
            possibleStartLocs.clear(); 
          } else{
            // If there is only one possible start location, we have found the start of the attempt
            return Array.from(possibleStartLocs)[0];
          }
        }
        else if (possibleStartLocs.size > 0){
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
    console.log(possibleStartLocs)
    return -1;
  }


  getLocBook(loc: number): BookM | undefined{
    if (loc < 0){
      return undefined;
    }
    for (let book of this.bible.v){
      if (loc < book.m.i + book.m.l){
        return book;
      }
    }
    return undefined;
  }

  getLocChapter(loc: number): ChapterM | undefined{
    if (loc < 0){
      return undefined;
    }
    for (let book of this.bible.v){
      if (loc < book.m.i + book.m.l){
        for (let chapter of book.v){
          if (loc < chapter.m.i + chapter.m.l){
            return chapter;
          }
        }
      }
    }
    return undefined;
  }

  getLocVerse(loc: number): VerseM | undefined{
    if (loc < 0){
      return undefined;
    }
    for (let book of this.bible.v){
      if (loc < book.m.i + book.m.l){
        for (let chapter of book.v){
          if (loc < chapter.m.i + chapter.m.l){
            for (let verse of chapter.v){
              if (loc < verse.m.i + verse.m.l){
                return verse;
              }
            }
          }
        }
      }
    }
    return undefined;
  }
  
  getLocWord(loc: number): string | undefined{
    if (loc < 0){
      return undefined;
    }
    for (let book of this.bible.v){
      if (loc < book.m.i + book.m.l){
        for (let chapter of book.v){
          if (loc < chapter.m.i + chapter.m.l){
            for (let verse of chapter.v){
              if (loc < verse.m.i + verse.m.l){
                return verse.v[loc - verse.m.i];
              }
            }
          }
        }
      }
    }
    return undefined;
  }

  getLocReference(loc: number): string[] | undefined{
    if (loc < 0){
      return undefined;
    }
    for (let book of this.bible.v){
      if (loc < book.m.i + book.m.l){
        for (let chapter of book.v){
          if (loc < chapter.m.i + chapter.m.l){
            for (let verse of chapter.v){
              if (loc < verse.m.i + verse.m.l){
                return [book.m.b, chapter.m.c.toString(), verse.m.v.toString()];
              }
            }
          }
        }
      }
    }
    return undefined; 
  }

  getBookText(book: BookM) {
    let chapters = [];
    for (let chapter of book.v){
      chapters.push(this.getChapterText(chapter));
    }
    return chapters.join(" ");
  }

  getChapterText(chapter: ChapterM) {
    let verses = [];
    for (let verse of chapter.v){
      verses.push(this.getVerseText(verse));
    }
    return verses.join(" ");
  }

  getVerseText(verse: VerseM) {
    return verse.v.join(" ");
  }

  getText(start_loc: number, end_loc: number): string | undefined {
    if(start_loc < 0 || end_loc < 0 || start_loc > end_loc){
      return undefined;
    }
    let cur_loc = start_loc;
    let build = ""
    for (let book of this.bible.v){
      if (cur_loc == book.m.i && book.m.i + book.m.l <= end_loc){
        build += this.getBookText(book) + " ";
        cur_loc += book.m.l;
      }
      else if (cur_loc < book.m.i + book.m.l){
        for (let chapter of book.v){
          if (cur_loc == chapter.m.i && chapter.m.i + chapter.m.l <= end_loc){
            build += this.getChapterText(chapter) + " ";
            cur_loc += chapter.m.l;
          }
          else if (cur_loc < chapter.m.i + chapter.m.l){
            for (let verse of chapter.v){
              if (cur_loc == verse.m.i && verse.m.i + verse.m.l <= end_loc){
                build += this.getVerseText(verse) + " ";
                cur_loc += verse.m.l;
              }
              else if (cur_loc < verse.m.i + verse.m.l){
                if(end_loc < verse.m.i + verse.m.l){
                  build += verse.v.slice(cur_loc - verse.m.i, end_loc - verse.m.i).join(" ");
                  return build;
                } else{
                  build += verse.v.slice(cur_loc - verse.m.i).join(" ") + " ";
                  cur_loc += verse.m.l - (cur_loc - verse.m.i);
                }
              }
            }
          }
        }
      } 
    }
    return "";
  }

  getPassageTitle(start_loc: number, end_loc: number): string | undefined {
    if(start_loc < 0 || end_loc < 0 || start_loc > end_loc){
      return undefined;
    }
    let start_ref = this.getLocReference(start_loc);
    let end_ref = this.getLocReference(end_loc);
    if (start_ref == undefined || end_ref == undefined){
      return undefined;
    }
    if (start_ref[0] == end_ref[0] && start_ref[1] == end_ref[1]){
      return start_ref[0] + " " + start_ref[1] + ":" + start_ref[2] + "-" + end_ref[2];
    } else if (start_ref[0] == end_ref[0]){
      return start_ref[0] + " " + start_ref[1] + ":" + start_ref[2] + " - " + end_ref[1] + ":" + end_ref[2];
    } else {
      return start_ref[0] + " " + start_ref[1] + ":" + start_ref[2] + " - " + end_ref[0] + " " + end_ref[1] + ":" + end_ref[2]; 
    }
  }
}
