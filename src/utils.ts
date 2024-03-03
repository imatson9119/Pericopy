import { BibleChange } from "./app/models/models";

export function trimDiff(diff: BibleChange[]): BibleChange[]{
  if(diff.length > 1){
    if(diff[0].added){
      diff.shift();
    }
    if(diff[diff.length - 1].added){
      diff.pop();
    }
  } 
  console.log(diff)
  return diff;
}