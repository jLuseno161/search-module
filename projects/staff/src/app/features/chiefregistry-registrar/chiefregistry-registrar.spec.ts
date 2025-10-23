import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChiefregistryRegistrar } from './chiefregistry-registrar';

describe('ChiefregistryRegistrar', () => {
  let component: ChiefregistryRegistrar;
  let fixture: ComponentFixture<ChiefregistryRegistrar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChiefregistryRegistrar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChiefregistryRegistrar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
