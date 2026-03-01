import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-hrd-employee-detail',
  standalone: false,
  templateUrl: './hrd-employee-detail.component.html',
  styleUrls: ['./hrd-employee-detail.component.scss']
})
export class HrdEmployeeDetailComponent {
  @Input() isOpen: boolean = false;
  @Input() employee: any = null;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
