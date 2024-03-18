import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BibleDisplayComponent } from './bible-display.component';

describe('BibleDisplayComponent', () => {
  let component: BibleDisplayComponent;
  let fixture: ComponentFixture<BibleDisplayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BibleDisplayComponent]
    });
    fixture = TestBed.createComponent(BibleDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
