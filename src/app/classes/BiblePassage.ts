import { Book, Chapter, Verse } from "./models";

export class BiblePassage {
  i: number;
  j: number;
  b1: Book
  c1: Chapter;
  v1: Verse;
  b2: Book;
  c2: Chapter;
  v2: Verse;
  constructor(
    i: number,
    j: number,
    b1: Book,
    c1: Chapter,
    v1: Verse,
    b2: Book,
    c2: Chapter,
    v2: Verse
  ) {
    if (i < 0 || j < 0 || i > j) {
      throw new Error('Invalid indices');
    }
    this.i = i;
    this.j = j;
    this.b1 = b1;
    this.c1 = c1;
    this.v1 = v1;
    this.b2 = b2;
    this.c2 = c2;
    this.v2 = v2;
  }

  toString() {
    if (this.b1.m.b === this.b2.m.b) {
      if (this.c1.m.c === this.c2.m.c) {
        if (this.v1.m.v === this.v2.m.v) {
          return `${this.b1.m.b} ${this.c1.m.c}:${this.v1.m.v}`;
        }
		return `${this.b1.m.b} ${this.c1.m.c}:${this.v1.m.v}-${this.v2.m.v}`;
      }
	  return `${this.b1.m.b} ${this.c1.m.c}:${this.v1.m.v}-${this.c2.m.c}:${this.v2.m.v}`;
    }
	return `${this.b1.m.b} ${this.c1.m.c}:${this.v1.m.v}-${this.b2.m.b} ${this.c2.m.c}:${this.v2.m.v}`;
  }
}
