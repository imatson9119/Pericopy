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

  getGoals() {
    return this.goalBank.goals;
  }

  deleteGoal(id: string){
    this.goalBank.goals.delete(id);
    this.storeGoals();
  }

  storeGoal(goal: Goal){
    this.goalBank.goals.set(goal.id, goal);
    this.storeGoals();
  }
  
  getGoal(id: string){
    return this.goalBank.goals.get(id);
  }

  initBank() {
    let storedResultBank = localStorage.getItem(this.resultBankStorageKey);
    if (storedResultBank === null){
      this.storeBank();
      return;
    }
    let resultBank = JSON.parse(storedResultBank, reviver);
    if (resultBank.version == undefined){
      this.loadVersionZero(resultBank);
      this.storeBank();
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
    this.resultBank.results.set(result.id, result); 
    this.storeBank();
  }

  deleteAttempt(id: string){
    this.resultBank.results.delete(id);
    this.storeBank();
  }

  getAttempt(id: string): IResult | undefined {
    return this.resultBank.results.get(id);
  }

  storeBank(){
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
    this.storeBank();
    this.storeGoals();
  }
}
