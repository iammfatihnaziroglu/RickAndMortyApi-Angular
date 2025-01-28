import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css']
})
export class FiltersComponent {
  @Output() filterChange = new EventEmitter<any>();
  
  statusOptions = [
    { value: '', display: 'All Statuses' },
    { value: 'Alive', display: '🟢 Alive' },
    { value: 'Dead', display: '🔴 Dead' },
    { value: 'unknown', display: '❔ Unknown' }
  ];

  genderOptions = [
    { value: '', display: 'All Genders' },
    { value: 'Female', display: '👩 Female' },
    { value: 'Male', display: '👨 Male' },
    { value: 'Genderless', display: '⚪ Genderless' },
    { value: 'unknown', display: '❔ Unknown' }
  ];

  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      name: [''],
      status: [''],
      species: [''],
      type: [''],
      gender: ['']
    });

    this.filterForm.valueChanges.subscribe(values => {
      this.filterChange.emit(values);
    });
  }
}