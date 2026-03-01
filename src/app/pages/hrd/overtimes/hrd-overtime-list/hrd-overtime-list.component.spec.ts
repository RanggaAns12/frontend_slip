import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrdOvertimeListComponent } from './hrd-overtime-list.component';

describe('HrdOvertimeListComponent', () => {
  let component: HrdOvertimeListComponent;
  let fixture: ComponentFixture<HrdOvertimeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HrdOvertimeListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrdOvertimeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
