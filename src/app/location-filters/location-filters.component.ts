import { Component, Output, EventEmitter, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  selector: 'app-location-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './location-filters.component.html',
  styleUrls: ['./location-filters.component.css']
})
export class LocationFiltersComponent implements OnInit, OnDestroy {
  @Output() filterChange = new EventEmitter<any>();
  @Input() errorMessage: string = '';
  
  showFilters = false;
  filterForm: FormGroup;
  private formSubscription?: Subscription;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      name: [''],
      type: [''],
      dimension: ['']
    });
  }

  ngOnInit() {
    this.filterForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe(values => this.filterChange.emit(values));
  }

  ngOnDestroy() {
    
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  
  resetFilters() {
    this.filterForm.reset();
    this.filterChange.emit({});
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
}
