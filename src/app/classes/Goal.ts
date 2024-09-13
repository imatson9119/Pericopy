import {
  Card,
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
} from 'ts-fsrs';
import { Bible } from './Bible';
import { IResult } from './models';
import { v4 as uuidv4 } from 'uuid';
import { BiblePassage } from './BiblePassage';
import { covers, intersection } from '../utils/utils';

export enum GoalStatus {
  MEMORIZING,
  MAINTAINING,
  MASTERED,
  INACTIVE,
}

export interface GoalStats {}

export class Goal {
  id: string; // Unique identifier
  t: number; // Timestamp
  title: string; // Title
  translation: string; // Translation
  i: number; // Start index
  j: number; // End index
  attempts: Set<string>; // Attempt IDs
  status: GoalStatus | undefined; // Status
  lastAttemptTimestamp: number | undefined; // Last attempt timestamp
  fsrsCard: Card | undefined; // FSRS card

  constructor(
    passage: BiblePassage,
    bible: Bible,
    prevAttempts: IResult[],
    status: GoalStatus | undefined
  ) {
    this.id = uuidv4();
    this.t = Date.now();
    this.translation = bible.m.t;
    this.i = passage.i;
    this.j = passage.j;
    this.title = bible.getPassage(passage.i, passage.j).toString();
    this.status = status;
    this.attempts = new Set(
      prevAttempts
        .filter((a) => {
          return intersection(a.diff.i, a.diff.j, this.i, this.j);
        })
        .map((a) => a.id)
    );
    if (this.status === GoalStatus.MAINTAINING) {
      this.createFSRSCard(new Map(prevAttempts.map((a) => [a.id, a])));
    }
  }

  promoteToMaintaining(attemptBank: Map<string, IResult>): void {
    this.status = GoalStatus.MAINTAINING;
    this.createFSRSCard(attemptBank);
  }
  createFSRSCard(attemptBank: Map<string, IResult>): void {
    let fsrsCard = createEmptyCard(Date.now());
    const fullAttempts: IResult[] = Array.from(this.attempts)
      .map((id) => attemptBank.get(id)!)
      .filter((a) => a !== undefined && covers(a.diff.i, a.diff.j, this.i, this.j));
    if (fullAttempts.length !== 0) {
      const lastAttempt = fullAttempts.reduce((prev, current) => {
        return prev.timestamp > current.timestamp ? prev : current;
      }); 
      fsrsCard.difficulty = lastAttempt.difficulty || Rating.Good;
      fsrsCard.elapsed_days = Math.floor(
        (Date.now() - lastAttempt.timestamp) / (1000 * 60 * 60 * 24)
      );
      fsrsCard.reps = fullAttempts.length;
    }
    this.fsrsCard = fsrsCard;

    const params = generatorParameters({
      enable_fuzz: true,
      enable_short_term: false,
    });
    const f = fsrs(params);
    console.log(f.repeat(fsrsCard, Date.now()));
    console.log(f.repeat(fsrsCard, Date.now()));
  }

  toJSON(): object {
    return {
      id: this.id,
      t: this.t,
      title: this.title,
      translation: this.translation,
      i: this.i,
      j: this.j,
      attempts: this.attempts,
      status: this.status,
      lastAttemptTimestamp: this.lastAttemptTimestamp,
      fsrsCard: this.fsrsCard,
    };
  }
}
