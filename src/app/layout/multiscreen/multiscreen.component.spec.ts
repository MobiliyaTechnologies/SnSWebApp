import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiscreenComponent } from './multiscreen.component';

describe('MultiscreenComponent', () => {
  let component: MultiscreenComponent;
  let fixture: ComponentFixture<MultiscreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultiscreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
