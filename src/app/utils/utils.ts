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
  return cleanWhitespace(text).replace(/[^\w —]/g, "").toLowerCase();
}

export function cleanWhitespace(text: string): string{
  return text.split(/\s+/).join(" ").trim();
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

export function getRelativeDate(dateParam: string | Date | number | null): string | null {
  if (!dateParam) {
    return null;
  }

  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const today = new Date();
  const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(months / 12);

  if (seconds < 60) {
    return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (days < 7) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}