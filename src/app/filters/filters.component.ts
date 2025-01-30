import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
export class FiltersComponent implements OnInit {
  @Input() errorMessage: string = '';
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
    { value: 'Genderless', display: '🟣 Genderless' },
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
  }

  ngOnInit() {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(values => {
        this.filterChange.emit(values);
      });
  }

  public resetFilters() {
    this.filterForm.reset({
      name: '',
      status: '',
      species: '',
      type: '',
      gender: '',
      episode: ''
    });
    this.filterChange.emit(this.filterForm.value);
  }
}