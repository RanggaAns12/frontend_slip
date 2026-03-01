import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarHrdComponent } from './sidebar-hrd.component';

describe('SidebarHrdComponent', () => {
  let component: SidebarHrdComponent;
  let fixture: ComponentFixture<SidebarHrdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarHrdComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SidebarHrdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
