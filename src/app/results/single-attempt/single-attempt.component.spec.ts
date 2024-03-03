import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleAttemptComponent } from './single-attempt.component';

describe('SingleAttemptComponent', () => {
  let component: SingleAttemptComponent;
  let fixture: ComponentFixture<SingleAttemptComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SingleAttemptComponent]
    });
    fixture = TestBed.createComponent(SingleAttemptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
