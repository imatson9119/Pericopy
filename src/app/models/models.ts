export interface Result {
  diff: BibleDiffNew;
  timestamp: Number;
  score: Number;
}

export interface ResultBank {
  results: Result[];
}

export interface WordMap {
  [word: string]: Set<number>;
}

export interface WordMapFile {
  [word: string]: number[];
}

export interface WordChange {
  t: DiffType; // Type
  v: string[]; // Value
}

export interface BibleDiff {
  diff: BibleChange[];
  start_loc: number;
  end_loc: number;
  title: string;
}

export interface BibleChange {
  added: boolean;
  removed: boolean;
  value: string[];
}

export interface Bible {
  m: BibleMetadata;
  v: Book[];
}

export interface BibleMetadata {
  t: string; // Translation
  i: number; // Start index
  l: number; // Length (words)
  nb: number; // Number of books
  nc: number; // Number of chapters
  nv: number; // Number of verses
}

export interface BibleDiffNew {
  m: BibleMetadata;
  p: string; // Passage title
  i: number; // Start index
  j: number; // End index
  v: BookDiff[];
}
export interface Book {
  m: BookMetadata;
  v: Chapter[];
}

export interface BookMetadata {
  b: string; // Book name
  i: number; // Start index
  l: number; // Length (words)
  nc: number; // Number of chapters
  nv: number; // Number of verses
}

export interface BookDiff {
  m: BookMetadata;
  v: ChapterDiff[];
}

export interface Chapter {
  m: ChapterMetadata;
  v: Verse[];
}

export interface ChapterMetadata {
  c: number; // Chapter number
  i: number; // Start index
  l: number; // Length (words)
  nv: number; // Number of verses
}

export interface ChapterDiff {
  m: ChapterMetadata;
  v: VerseDiff[];
}

export interface Verse {
  m: VerseMetadata;
  v: string[];
}

export interface VerseMetadata {
  v: number; // Verse number
  i: number; // Start index
  l: number; // Length (words)
}

export interface VerseDiff {
  m: VerseMetadata;
  v: VerseChange[];
}

export interface VerseChange {
  t: DiffType; // Type
  v: string[]; // Value
}

export enum DiffType {
  Added,
  Removed,
  Unchanged
}
