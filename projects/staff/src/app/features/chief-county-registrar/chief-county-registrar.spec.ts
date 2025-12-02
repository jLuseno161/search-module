import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChiefCountyRegistrar } from './chief-county-registrar';

describe('ChiefCountyRegistrar', () => {
  let component: ChiefCountyRegistrar;
  let fixture: ComponentFixture<ChiefCountyRegistrar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChiefCountyRegistrar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChiefCountyRegistrar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
