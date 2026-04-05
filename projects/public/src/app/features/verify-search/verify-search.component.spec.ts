import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifySearchComponent } from './verify-search.component';

describe('VerifySearchComponent', () => {
  let component: VerifySearchComponent;
  let fixture: ComponentFixture<VerifySearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifySearchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerifySearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
