import { Change } from "diff";

export interface Result {
	diff: Change[]
	timestamp: Number
	score: Number
}

export interface ResultBank {
	results: Result[]
}

export interface Bible {
	metadata: {
	  translation: string,
	  books: number,
	  loc: number,
	  chapters: number,
	  words: number,
	  verses: number
	},
	content: Book[]
  }
  
  export interface Book {
	metadata: {
	  book: string,
	  loc: number,
	  chapters: number,
	  verses: number,
	  words: number
	},
	content: Chapter[]
  }
  
  export interface Chapter {
	metadata: {
	  book: string,
	  chapter: number,
	  loc: number,
	  verses: number,
	  words: number
	},
	content: Verse[]
  }
  
  export interface Verse {
	metadata: {
	  book: string,
	  chapter: number,
	  verse: number,
	  loc: number,
	  words: number
	},
	content: string[]
  }

  export interface WordMap {
	[word: string]: Set<number>
  }

  export interface WordMapFile {
	[word: string]: number[]
  }