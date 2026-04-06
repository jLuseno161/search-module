import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousWorksComponent } from './previous-works.component';

describe('PreviousWorksComponent', () => {
  let component: PreviousWorksComponent;
  let fixture: ComponentFixture<PreviousWorksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousWorksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreviousWorksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
