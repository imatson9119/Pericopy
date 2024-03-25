import { Change } from "diff";
import { DiffType, WordChange } from "../classes/models";


const bookAbbreviations: { [key: string]: string } = {
  "genesis": "Gen",
  "exodus": "Exo",
  "leviticus": "Lev",
  "numbers": "Num",
  "deuteronomy": "Deu",
  "joshua": "Jos",
  "judges": "Jdg",
  "ruth": "Rth",
  "1 samuel": "1Sa",
  "2 samuel": "2Sa",
  "1 kings": "1Ki",
  "2 kings": "2Ki",
  "1 chronicles": "1Ch",
  "2 chronicles": "2Ch",
  "ezra": "Eza",
  "nehemiah": "Neh",
  "esther": "Est",
  "job": "Job",
  "psalms": "Psa",
  "proverbs": "Pro",
  "ecclesiastes": "Ecc",
  "song of solomon": "SS",
  "isaiah": "Isa",
  "jeremiah": "Jer",
  "lamentations": "Lam",
  "ezekiel": "Ezk",
  "daniel": "Dan",
  "hosea": "Hos",
  "joel": "Joe",
  "amos": "Amo",
  "obadiah": "Obd",
  "jonah": "Jon",
  "micah": "Mic",
  "nahum": "Nah",
  "habakkuk": "Hab",
  "zephaniah": "Zep",
  "haggai": "Hag",
  "zechariah": "Zch",
  "malachi": "Mal",
  "matthew": "Mat",
  "mark": "Mrk",
  "luke": "Luk",
  "john": "Jn",
  "acts": "Act",
  "romans": "Rom",
  "1 corinthians": "1Co",
  "2 corinthians": "2Co",
  "galatians": "Gal",
  "ephesians": "Eph",
  "philippians": "Php",
  "colossians": "Col",
  "1 thessalonians": "1Th",
  "2 thessalonians": "2Th",
  "1 timothy": "1Ti",
  "2 timothy": "2Ti",
  "titus": "Tit",
  "philemon": "Phm",
  "hebrews": "Heb",
  "james": "Jam",
  "1 peter": "1Pe",
  "2 peter": "2Pe",
  "1 john": "1Jo",
  "2 john": "2Jo",
  "3 john": "3Jo",
  "jude": "Jud",
  "revelation": "Rev",
}

export function sanitizeText(text: string): string{
  return cleanWhitespace(text).replace(/[^\w ]/g, "").toLowerCase();
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

export function abbreviateBookName(bookName: string): string {
  return bookAbbreviations[bookName.toLowerCase()] || bookName;
}