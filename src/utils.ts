import { Change } from "diff";

export function trim_diff(diff: Change[]): Change[]{
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