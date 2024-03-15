export class BiblePassage {
  i: number;
  j: number;
  b1: string;
  c1: number;
  v1: number;
  b2: string;
  c2: number;
  v2: number;
  constructor(
    i: number,
    j: number,
    b1: string,
    c1: number,
    v1: number,
    b2: string,
    c2: number,
    v2: number
  ) {
    if (i < 0 || j < 0 || i > j) {
      throw new Error('Invalid indices');
    }
    this.i = i;
    this.j = j;
    this.b1 = b1;
    this.c1 = c1;
    this.v1 = v1;
    this.b2 = b2;
    this.c2 = c2;
    this.v2 = v2;
  }

  toString() {
    if (this.b1 === this.b2) {
      if (this.c1 === this.c2) {
        if (this.v1 === this.v2) {
          return `${this.b1} ${this.c1}:${this.v1}`;
        }
		return `${this.b1} ${this.c1}:${this.v1}-${this.v2}`;
      }
	  return `${this.b1} ${this.c1}:${this.v1}-${this.c2}:${this.v2}`;
    }
	return `${this.b1} ${this.c1}:${this.v1}-${this.b2} ${this.c2}:${this.v2}`;
  }
}
