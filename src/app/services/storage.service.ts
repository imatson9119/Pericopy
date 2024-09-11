import { Injectable } from '@angular/core';
import { Goal, GoalBank, IResult, ResultBank } from '../classes/models';
import { intersection, replacer, reviver } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  resultBankStorageKey = "result_bank"
  resultBank: ResultBank;

  goalBankStorageKey = "goal_bank"
  goalBank: GoalBank;

  constructor() { 
    this.resultBank = {"version": 1, "results": new Map()};
    this.goalBank = {"version": 1, "goals": new Map()};
    this.initBank();
    this.initGoals();
  }

  initGoals() {
    let storedGoalBank = localStorage.getItem(this.goalBankStorageKey);
    if (storedGoalBank === null){
      this.storeGoals();
      return;
    }
    let goalBank = JSON.parse(storedGoalBank, reviver);
    this.goalBank = goalBank;
  }

  storeGoals() {
    localStorage.setItem(this.goalBankStorageKey, JSON.stringify(this.goalBank, replacer));
  }

  getGoals(translation: string = '') {
    let goals = new Map<string, Goal>();
    for(let goal of this.goalBank.goals.values()){
      if (translation == '' || goal.translation == translation){
        goals.set(goal.id, goal);
      }
    }
    return goals;
  }

  deleteGoal(id: string){
    if (this.goalBank.goals.has(id)){
      let goal = this.goalBank.goals.get(id);
      if (goal && goal.attempts){
        for (let attemptId of goal.attempts){
          let attempt = this.resultBank.results.get(attemptId);
          if (attempt){
            attempt.goals?.delete(id);
          }
        }
        this.storeAttempts();
      }
    }
    this.goalBank.goals.delete(id);
    this.storeGoals();
  }

  storeGoal(goal: Goal){
    if (goal.attempts) {
      for (let attemptId of goal.attempts){
        let attempt = this.resultBank.results.get(attemptId);
        if (attempt){
          attempt.goals?.add(goal.id);
        } else {
          goal.attempts.delete(attemptId);
        }
      }
      this.storeAttempts();
    } else {
      goal.attempts = new Set();
    }
    this.goalBank.goals.set(goal.id, goal);
    this.storeGoals();
  }
  
  getGoal(id: string){
    return this.goalBank.goals.get(id);
  }

  initBank() {
    let storedResultBank = localStorage.getItem(this.resultBankStorageKey);
    if (storedResultBank === null){
      this.storeAttempts();
      return;
    }
    let resultBank = JSON.parse(storedResultBank, reviver);
    if (resultBank.version == undefined){
      this.loadVersionZero(resultBank);
      this.storeAttempts();
      return;
    }
    this.resultBank = resultBank;
  }
  
  loadVersionZero(oldBank: any) {
    for (let result of oldBank.results){
      this.resultBank.results.set(result.id, result);
    }
  }

  storeAttempt(result: IResult){
    if(result.goals){
      for (let goalId of result.goals){
        let goal = this.goalBank.goals.get(goalId);
        if (goal){
          goal.attempts?.add(result.id);
        } else {
          result.goals.delete(goalId);
        }
      }
      this.storeGoals();
    } else {
      result.goals = new Set();
    }
    this.resultBank.results.set(result.id, result); 
    this.storeAttempts();
  }

  deleteAttempt(id: string){
    let result = this.resultBank.results.get(id);
    if (result && result.goals){
      for (let goalId of result.goals){
        let goal = this.goalBank.goals.get(goalId);
        if (goal){
          goal.attempts?.delete(id);
        }
      }
      this.storeGoals();
    }
    this.resultBank.results.delete(id);
    this.storeAttempts();
  }

  getAttempt(id: string): IResult | undefined {
    return this.resultBank.results.get(id);
  }

  storeAttempts(){
    localStorage.setItem(this.resultBankStorageKey, JSON.stringify(this.resultBank, replacer));
  }

  getAttempts(version: string = ''){
    let attempts = new Map<string, IResult>();
    for(let attempt of this.resultBank.results.values()){
      if (version == '' || attempt.diff.m.t == version){
        attempts.set(attempt.id, attempt);
      }
    }
    return attempts;
  }

  getLastAttempt(version: string = ''){
    let attempts = this.getAttempts();
    let lastAttempt = undefined;
    for(let attempt of attempts.values()){
      if ((lastAttempt == undefined || attempt.timestamp > lastAttempt.timestamp) && (version == '' || attempt.diff.m.t == version)){
        lastAttempt = attempt;
      }
    }
    return lastAttempt;
  }

  getBank(): ResultBank {
    return this.resultBank;
  }

  importBank(bank: ResultBank){
    for(let result of bank.results.values()){
      for (let goal of this.goalBank.goals.values()){
        if (intersection(result.diff.i, result.diff.j, goal.i, goal.j)){
          goal.attempts.add(result.id);
        }
      }
      this.storeAttempt(result);
    }
    this.storeAttempts();
    this.storeGoals();
  }
}
