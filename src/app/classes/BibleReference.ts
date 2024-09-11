export class BibleReference {
  book: string;
  chapter: number;
  verse: number;

  constructor(book: string, chapter: number, verse: number) {
	this.book = book;
	this.chapter = chapter;
	this.verse = verse;
  }

  toString(): string {
	return `${this.book} ${this.chapter}:${this.verse}`;
  }
}