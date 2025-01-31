import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { debounceTime, filter, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-episode-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './episode-filters.component.html',
  styleUrls: ['./episode-filters.component.css']
})
export class EpisodeFiltersComponent implements OnInit {
  @Output() filterChange = new EventEmitter<any>();
  showFilters = false;
  
  seasons = [1, 2, 3, 4, 5];
  episodes: number[] = [];
  
  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      name: [''],
      season: [''],
      episode: ['']
    });
  }

  ngOnInit() {
    this.updateEpisodes(null);
    
    this.filterForm.get('season')?.valueChanges.subscribe(season => {
      this.updateEpisodes(season);
      this.filterForm.patchValue({ episode: '' });
    });

    this.filterForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe(values => this.filterChange.emit(values));
  }

  private updateEpisodes(season: string | null): void {
    if (!season) {
      this.episodes = Array.from({length: 11}, (_, i) => i + 1);
    } else {
      const count = season === '1' ? 11 : 10;
      this.episodes = Array.from({length: count}, (_, i) => i + 1);
    }
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  formatEpisodeDisplay(episodeCode: string): string {
    const matches = episodeCode.match(/S(\d+)E(\d+)/);
    if(matches) {
      const season = parseInt(matches[1], 10);
      const episode = parseInt(matches[2], 10);
      return `${season}. Sezon ${episode}. Bölüm`;
    }
    return episodeCode;
  }

  getSeasonNumber(episode: number): number {
    return Math.floor((episode - 1) / 11) + 1;
  }

  getEpisodeNumber(episode: number): number {
    return ((episode - 1) % 11) + 1;
  }

  resetFilters(): void {
    this.filterForm.reset({
      name: '',
      season: '',
      episode: ''
    });
    this.filterChange.emit(this.filterForm.value);
  }
}
