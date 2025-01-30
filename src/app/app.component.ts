import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FiltersComponent } from "./filters/filters.component";
import { LocationFiltersComponent } from './location-filters/location-filters.component';
import { of, catchError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';

interface Character {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
  episode: string[];
  created: string;
}

interface Location {
  id: number;
  name: string;
  type: string;
  dimension: string;
  residents: string[];
}

interface Episode {
  id: number;
  name: string;
  air_date: string;
  episode: string;
  characters: string[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FiltersComponent,
    NavigationComponent,
    LocationFiltersComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild(FiltersComponent) filtersComponent!: FiltersComponent;

  characters: Character[] = [];
  currentPage = 1;
  totalPages = 1;
  selectedCharacter: Character | null = null;
  errorMessage: string | null = null;
  currentView: 'characters' | 'locations' | 'episodes' = 'characters';
  locations: Location[] = [];
  episodes: Episode[] = [];
  selectedLocation: any = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadData();
  }

 
  loadCharacters(page: number = 1, filters: any = {}) {
    this.errorMessage = null;
    this.characters = [];

    const handleError = (err: any) => {
      this.errorMessage = this.getErrorMessage(err.status);
      this.characters = [];
      this.totalPages = 1;
      return of(null);
    };

    if (filters.episode) {
      this.http.get<any>(`https://rickandmortyapi.com/api/episode/${filters.episode}`).pipe(
        catchError(handleError),
        switchMap(episode => {
          if (!episode) return of(null);
          
          const characterIds = episode.characters
            .map((url: string) => url.split('/').pop())
            .join(',');
          
          return this.http.get<any>(`https://rickandmortyapi.com/api/character/${characterIds}`).pipe(
            catchError(handleError)
          );
        })
      ).subscribe(response => {
        if (!response) return;
        
        this.characters = Array.isArray(response) ? response : [response];
        this.totalPages = 1;
        this.currentPage = 1;
        if (this.characters.length === 0) {
          this.errorMessage = 'No characters found in this section';
        }
      });
    } else {
      let params = new HttpParams().set('page', page.toString());
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });

      this.http.get<any>(`https://rickandmortyapi.com/api/character`, { params }).pipe(
        catchError(handleError)
      ).subscribe(response => {
        if (!response) return;
        
        this.characters = response.results;
        this.totalPages = response.info.pages;
        this.currentPage = page;
        if (this.characters.length === 0) {
          this.errorMessage = 'Bu filtrelerle eşleşen karakter bulunamadı';
        }
      });
    }
  }

  private getErrorMessage(status: number): string {
    switch(status) {
      case 404: return 'No results found for your search/filter criteria';
      case 500: return 'Server error, please try again later';
      default: return 'An unexpected error occurred';
    }
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      switch(this.currentView) {
        case 'characters':
          this.loadCharacters(newPage);
          break;
        case 'locations':
          this.loadLocations(newPage);
          break;
        case 'episodes':
          this.loadEpisodes(newPage);
          break;
      }
    }
  }

  showCharacterDetails(id: number) {
    this.http.get<Character>(`https://rickandmortyapi.com/api/character/${id}`)
      .subscribe({
        next: (char) => this.selectedCharacter = char,
      });
  }

 
  onFilterChange(filters: any) {
    this.loadCharacters(1, filters);
  }

  resetToHome() {
    this.router.navigate(['/']).then(() => {
      this.filtersComponent.resetFilters();
      this.currentPage = 1;
      this.loadCharacters(1, {});
    });
  }

  onTabSelected(tab: string) {
    this.currentView = tab.toLowerCase() as 'characters' | 'locations' | 'episodes';
    this.characters = [];
    this.locations = [];
    this.episodes = [];
    this.errorMessage = null;
    this.loadData();
  }

  private loadData() {
    switch(this.currentView) {
      case 'characters':
        this.loadCharacters();
        break;
      case 'locations':
        this.loadLocations();
        break;
      case 'episodes':
        this.loadEpisodes();
        break;
    }
  }

  private handleError = (err: any) => {
    this.errorMessage = this.getErrorMessage(err.status);
    this.characters = [];
    this.locations = [];
    this.episodes = [];
    return of(null);
  }

  private loadLocations(page: number = 1, filters: any = {}) {

    let params = new HttpParams()
      .set('page', page.toString());


    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key].trim() !== '') {
          params = params.set(key, filters[key].trim());
        }
      });
    }

    

    this.http.get<any>(`https://rickandmortyapi.com/api/location`, { params })
      .pipe(
        catchError(error => {
          return this.handleError(error);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.locations = response.results;
            this.totalPages = response.info.pages;
            this.currentPage = page;
          }
        },
       
      });
  }

  private loadEpisodes(page: number = 1) {
    this.http.get<any>(`https://rickandmortyapi.com/api/episode?page=${page}`)
      .pipe(
        catchError(this.handleError)
      ).subscribe({
        next: (res) => {
          if(res) {
            this.episodes = res.results;
            this.totalPages = res.info.pages;
          }
        }
      });
  }

  onLocationFilterChange(filters: any) {
    this.currentPage = 1;
    this.loadLocations(1, filters);
  }

  showLocationDetails(locationId: number): void {
    this.http.get(`https://rickandmortyapi.com/api/location/${locationId}`)
      .subscribe({
        next: (location: any) => {
          this.selectedLocation = {
            ...location,
            residentsCount: location.residents.length
          };
        },
      });
  }

  closeModal(): void {
    this.selectedLocation = null;
  }

  // Mobil dokunmatik kontrolü
  handleTouch(event: TouchEvent): void {
    if (this.selectedLocation) {
      event.preventDefault();
      this.closeModal();
    }
  }
}
