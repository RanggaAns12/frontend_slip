import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvertimeShowComponent } from './overtime-show.component';

describe('OvertimeShowComponent', () => {
  let component: OvertimeShowComponent;
  let fixture: ComponentFixture<OvertimeShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OvertimeShowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OvertimeShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
