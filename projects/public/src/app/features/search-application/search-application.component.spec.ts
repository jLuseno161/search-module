import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchApplicationComponent } from './search-application.component';

describe('SearchApplicationComponent', () => {
  let component: SearchApplicationComponent;
  let fixture: ComponentFixture<SearchApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchApplicationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
