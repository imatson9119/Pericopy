import { Change } from "diff";

export interface Result {
	diff: Change[]
	timestamp: Number
	score: Number
}

export interface ResultBank {
	results: Result[]
}