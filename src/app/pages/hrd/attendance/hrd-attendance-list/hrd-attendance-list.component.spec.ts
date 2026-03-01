import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrdAttendanceListComponent } from './hrd-attendance-list.component';

describe('HrdAttendanceListComponent', () => {
  let component: HrdAttendanceListComponent;
  let fixture: ComponentFixture<HrdAttendanceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HrdAttendanceListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrdAttendanceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
