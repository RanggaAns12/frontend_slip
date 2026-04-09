import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-employee-detail',
  standalone: false,
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss']
})
export class EmployeeDetailComponent {
  @Input() isOpen: boolean = false;
  @Input() employee: any = null;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}