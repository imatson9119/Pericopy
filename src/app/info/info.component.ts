import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title, Meta } from '@angular/platform-browser';
import { DonatePopupComponent } from './donate-popup/donate-popup.component';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {

  constructor(
    private dialog: MatDialog,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    const pageTitle = 'About Pericopy | Scripture Memorization App';
    const pageDescription = 'Learn how Pericopy helps you memorize scripture more effectively through spaced repetition, intelligent feedback, and personalized learning techniques.';

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:url', content: 'https://pericopy.net/info' });
  }

  openDonatePopup() {
    this.dialog.open(DonatePopupComponent);
  }
}
