import { inject } from "@angular/core"
import { BibleService } from "../services/bible.service"
import { ResolveFn } from "@angular/router"
import { Bible } from "../classes/Bible"
export const bibleResolver: ResolveFn<Bible | undefined> = (route, state) => {
	return inject(BibleService).curBible;
}