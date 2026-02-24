import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvertimeListComponent } from './overtime-list.component';

describe('OvertimeListComponent', () => {
  let component: OvertimeListComponent;
  let fixture: ComponentFixture<OvertimeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OvertimeListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OvertimeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
