import { TestBed } from '@angular/core/testing';

import { ApplicationServiceTs } from './application.service';

describe('ApplicationServiceTs', () => {
  let service: ApplicationServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
