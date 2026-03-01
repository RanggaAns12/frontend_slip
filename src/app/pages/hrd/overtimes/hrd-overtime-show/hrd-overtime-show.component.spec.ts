import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrdOvertimeShowComponent } from './hrd-overtime-show.component';

describe('HrdOvertimeShowComponent', () => {
  let component: HrdOvertimeShowComponent;
  let fixture: ComponentFixture<HrdOvertimeShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HrdOvertimeShowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrdOvertimeShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
