import {
  Card,
  createEmptyCard,
  fsrs,
  generatorParameters,
} from 'ts-fsrs';
import { Bible } from './Bible';
import { getRatingFromAttempt, IResult } from './models';
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
  fsrsCard: Card | undefined; // FSRS card

  constructor(
    id: string,
    t: number,
    title: string,
    translation: string,
    i: number,
    j: number,
    attempts: Set<string>,
    status: GoalStatus | undefined,
    fsrsCard: Card | undefined
  ) {
    this.id = id;
    this.t = t;
    this.title = title;
    this.translation = translation;
    this.i = i;
    this.j = j;
    this.attempts = attempts;
    this.status = status;
    this.fsrsCard = fsrsCard;
  }

  static createGoal(
    passage: BiblePassage,
    bible: Bible,
    prevAttempts: IResult[],
    status: GoalStatus | undefined
  ) {
    let id = uuidv4();
    let t = Date.now();
    let translation = bible.m.t;
    let i = passage.i;
    let j = passage.j;
    let title = bible.getPassage(passage.i, passage.j).toString();
    let goalStatus = status;
    let attempts = new Set(
      prevAttempts
        .filter((a) => {
          return intersection(a.diff.i, a.diff.j, i, j);
        })
        .map((a) => a.id)
    );
    let fsrsCard = undefined;
    if (status === GoalStatus.MAINTAINING) {
      fsrsCard = Goal.createFSRSCardWithAttempts(i, j, prevAttempts);
    }
    return new Goal(id, t, title, translation, i, j, attempts, goalStatus, fsrsCard);
  }

  promoteToMaintaining(): void {
    this.status = GoalStatus.MAINTAINING;
  }

  /**
   * 
   * @param i - The start index of the goal.
   * @param j - The end index of the goal.
   * @param attemptList - The list of attempts to use to create the FSRS card.
   * @returns The FSRS card.
   * 
   */
  static createFSRSCardWithAttempts(i: number, j: number, attemptList: IResult[]): Card | undefined {
    if (attemptList.length === 0) {
      return undefined;
    }
    const fullAttempts: IResult[] = attemptList.filter((a) => {
      if (covers(a.diff.i, a.diff.j + 1, i, j)) {
      }
      return covers(a.diff.i, a.diff.j + 1, i, j)
    }).sort((a, b) => a.timestamp - b.timestamp);

    console.log("Full attempts: ", fullAttempts.length);
    const params = generatorParameters({
      enable_fuzz: false,
      enable_short_term: false,
    });
    const f = fsrs(params);
    
    if (fullAttempts.length === 0) {
      return undefined
    }

    let card = createEmptyCard(fullAttempts[0].timestamp);
    for (let attempt of fullAttempts) {
      const aDiff = getRatingFromAttempt(attempt);
      // @ts-ignore
      card = f.repeat(card, attempt.timestamp)[aDiff].card;
    }
    console.log("Refreshed FSRS card: ", card);
    return card;
  }

  /**
   * Adds an attempt to the goal, updating the goal's attempts, last attempt timestamp, and FSRS card.
   * @param attempt - The attempt to add
   * @param attemptBank - The entire attempt bank containing all the user's attempts.
   */
  addAttempt(attempt: IResult, attemptBank: Map<string, IResult>): void {
    this.attempts.add(attempt.id);
    attemptBank.set(attempt.id, attempt);
    if (this.status === GoalStatus.MAINTAINING) {
      this.fsrsCard = Goal.createFSRSCardWithAttempts(this.i, this.j, Goal.getGoalAttempts(this, attemptBank));;
    }
  }

  /**
   * Deletes an attempt from the goal, updating the goal's attempts and FSRS card.
   * @param attemptId - The ID of the attempt to delete
   * @param attemptBank - The entire attempt bank containing all the user's attempts.
   */
  deleteAttempt(attemptId: string, attemptBank: Map<string, IResult>): void {
    this.attempts.delete(attemptId);
    if (this.status === GoalStatus.MAINTAINING) {
      this.fsrsCard = Goal.createFSRSCardWithAttempts(this.i, this.j, Goal.getGoalAttempts(this, attemptBank));
    }
  }

  static getGoalAttempts(goal: Goal, attemptBank: Map<string, IResult>): IResult[] {
    return Array.from(goal.attempts.values()).map((id) => {
      return attemptBank.get(id);
    }).filter((a) => a !== undefined);
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
      fsrsCard: this.fsrsCard 
    };
  }

  static fromJSON(json: any): Goal {
    if (json.fsrsCard) {
      json.fsrsCard.due = new Date(json.fsrsCard.due);
    }
    return new Goal(
      json.id,
      json.t,
      json.title,
      json.translation,
      json.i,
      json.j,
      new Set(json.attempts),
      json.status,
      json.fsrsCard
    );
  }
}
