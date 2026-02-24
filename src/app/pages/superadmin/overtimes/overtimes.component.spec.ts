import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvertimesComponent } from './overtimes.component';

describe('OvertimesComponent', () => {
  let component: OvertimesComponent;
  let fixture: ComponentFixture<OvertimesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OvertimesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OvertimesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
