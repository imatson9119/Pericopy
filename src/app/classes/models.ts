import { Rating } from "ts-fsrs";
import { Goal } from "./Goal";


export interface IResult {
  id: string;
  diff: BibleDiff;
  timestamp: number;
  score: number;
  raw: string;
  goals: Set<string>;
  difficulty: Rating | undefined
}

export function getRatingFromAttempt(IResult: IResult): Rating {
  // Used to calculate the actual rating of an attempt given the user responded difficulty
  // and the score of the attempt. 
  if(IResult.score < 0.85){
    return Rating.Again;
  }
  if(IResult.difficulty === undefined){
    return Rating.Hard;
  }
  return IResult.difficulty;
}

export interface ResultBank {
  version: number;
  results: Map<string, IResult>;
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

export interface IBible {
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

export interface BibleDiff {
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
  bn: number; // Book number
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

export interface BiblePointer {
  book: Book;
  chapter: Chapter;
  verse: Verse;
  index: number; // Index in the original verse
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
  i: number; // Index
  t: DiffType; // Type
  v: string[]; // Value
}

export enum DiffType {
  ADDED,
  REMOVED,
  UNCHANGED
}

export interface BibleWord {
  word: string;
  index: number;
  book: Book;
  chapter: Chapter;
  verse: Verse;
}

export interface Reference {
  book: string;
  chapter: number;
  verse: number;
}

export interface GoalBank {
  version: number;
  goals: Map<string, Goal>;
}

export enum AnchorType {
  START,
  END
}

// Maps an index in the bible to a list of HeatmapMistakes
export type Heatmap = Map<number, number[]>;
