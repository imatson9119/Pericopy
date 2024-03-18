import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAttemptDialogComponent } from './delete-attempt-dialog.component';

describe('DeleteAttemptDialogComponent', () => {
  let component: DeleteAttemptDialogComponent;
  let fixture: ComponentFixture<DeleteAttemptDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteAttemptDialogComponent]
    });
    fixture = TestBed.createComponent(DeleteAttemptDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
