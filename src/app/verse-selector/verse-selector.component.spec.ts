import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerseSelectorComponent } from './verse-selector.component';

describe('VerseSelectorComponent', () => {
  let component: VerseSelectorComponent;
  let fixture: ComponentFixture<VerseSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VerseSelectorComponent]
    });
    fixture = TestBed.createComponent(VerseSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
