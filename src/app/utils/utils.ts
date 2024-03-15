import { Change } from "diff";
import { BibleChange, DiffType, WordChange } from "../classes/models";

export function trimDiff(diff: BibleChange[]): BibleChange[]{
  if(diff.length > 1){
    if(diff[0].added){
      diff.shift();
    }
    if(diff[diff.length - 1].added){
      diff.pop();
    }
  } 
  return diff;
}

export function sanitizeText(text: string): string{
  return text.trim().replace(/[^\w ]/g, "").toLowerCase().split(/\s+/).join(" ");
}

export function addToMapValue<T>(map: Map<T,number>, key: T, value: number): void {
  if (map.has(key)){
    map.set(key, map.get(key) as number + value);
  } else {
    map.set(key, value);
  }
}

export function getWordChange(diff: Change[]): WordChange[] {
  let wordChanges: WordChange[] = [];
  for (let change of diff){
    let added = Object.hasOwn(change, "added") && change.added !== undefined;
    let removed = Object.hasOwn(change, "removed") && change.removed !== undefined;
    let type: DiffType = added ? DiffType.Added : removed ? DiffType.Removed : DiffType.Unchanged;
    let sanitizedText = sanitizeText(change.value);
    if (sanitizedText === ""){
      continue;
    }
    wordChanges.push({
      "t": type,
      "v": sanitizedText.split(" "),
    });
  }
  return wordChanges;
}