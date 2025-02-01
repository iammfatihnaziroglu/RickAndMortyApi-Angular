import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FiltersComponent } from "./filters/filters.component";
import { LocationFiltersComponent } from './location-filters/location-filters.component';
import { of, catchError, switchMap, finalize, delay } from 'rxjs';
import { Router } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { EpisodeFiltersComponent } from './episode-filters/episode-filters.component';

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
    LocationFiltersComponent,
    EpisodeFiltersComponent
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
  showFilters = false;
  showCharacterFilters = false;
  showLocationFilters = false;
  selectedEpisode: any = null;
  characterNames: {[key: string]: string} = {};

  // Yüklenme durumunu belirten property
  isLoading: boolean = false;
  showLoader: boolean = true;

  showErrorDelayed = false;
  private errorTimer: any;

  // Yeni değişken ekleyelim
  isResettingFilters = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadData();
  }

  loadCharacters(page: number = 1, filters: any = {}) {
    const loadingPromise = new Promise(resolve => setTimeout(resolve, 2000));
    
    this.isLoading = true;
    this.showLoader = true;
    this.errorMessage = null;
    this.characters = [];
    
    const handleError = (err: any) => {
      loadingPromise.then(() => {
        this.isLoading = false;
        this.showLoader = true;
        this.errorMessage = this.getErrorMessage(err.status);
      });
      return of(null);
    };

    if (filters.episode) {
      this.http.get<any>(`https://rickandmortyapi.com/api/episode/${filters.episode}`).pipe(
        delay(1000),
        catchError(handleError),
        switchMap(episode => {
          if (!episode) return of(null);
          
          const characterIds = episode.characters
            .map((url: string) => url.split('/').pop())
            .join(',');
          
          return this.http.get<any>(`https://rickandmortyapi.com/api/character/${characterIds}`).pipe(
            catchError(handleError)
          );
        }),
        
      ).subscribe(response => {
        if (!response) return;
        
        this.characters = Array.isArray(response) ? response : [response];
        this.totalPages = 1;
        this.currentPage = 1;
        if (this.characters.length === 0) {
          this.errorMessage = 'No characters found in this section';
        }
        loadingPromise.then(() => {
          this.isLoading = false;
          this.showLoader = true;
        });
      });
    } else {
      let params = new HttpParams().set('page', page.toString());
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });

      this.http.get<any>(`https://rickandmortyapi.com/api/character`, { params }).pipe(
        delay(3000),
        catchError(handleError),
      ).subscribe(response => {
        if (!response) return;
        
        this.characters = response.results;
        this.totalPages = response.info.pages;
        this.currentPage = page;
        if (this.characters.length === 0) {
          this.errorMessage = 'Bu filtrelerle eşleşen karakter bulunamadı';
        }
        loadingPromise.then(() => {
          this.isLoading = false;
          this.showLoader = true;
        });
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

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) return;
    
    this.currentPage = newPage;
    
    switch(this.currentView) {
      case 'characters':
        this.loadCharacters(this.currentPage);
        break;
      case 'locations':
        this.loadLocations(this.currentPage);
        break;
      case 'episodes':
        this.loadEpisodes(this.currentPage);
        break;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  onTabSelected(tab: string): void {
    this.currentView = tab.toLowerCase() as 'characters' | 'locations' | 'episodes';
    this.showCharacterFilters = false;
    this.showLocationFilters = false;
    this.characters = [];
    this.locations = [];
    this.episodes = [];
    this.errorMessage = null;
    // Tab geçişlerinde de yükleniyor durumunu göstermek için isLoading true yapıyoruz.
    this.isLoading = true;
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
        this.loadEpisodes(1);
        break;
    }
  }

  private handleError = (err: any) => {
    this.errorMessage = this.getErrorMessage(err.status);
    this.showDelayedError();
    this.characters = [];
    this.locations = [];
    this.episodes = [];
    return of(null);
  }

  private loadLocations(page: number = 1, filters: any = {}) {
    const loadingPromise = new Promise(resolve => setTimeout(resolve, 2000));
    
    this.isLoading = true;
    this.showLoader = true;
    
    let params = new HttpParams().set('page', page.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key].trim() !== '') {
          params = params.set(key, filters[key].trim());
        }
      });
    }

    this.http.get<any>(`https://rickandmortyapi.com/api/location`, { params })
      .pipe(
        delay(3000),
        catchError(error => {
          loadingPromise.then(() => {
            this.isLoading = false;
            this.showLoader = true;
            this.handleError(error);
          });
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.locations = response.results;
            this.totalPages = response.info.pages;
            this.currentPage = page;
          }
          loadingPromise.then(() => {
            this.isLoading = false;
            this.showLoader = true;
          });
        },
      });
  }

  private loadEpisodes(page: number, filters: any = {}): void {
    const loadingPromise = new Promise(resolve => setTimeout(resolve, 2000));
    
    this.isLoading = true;
    this.showLoader = true;
    
    let params = new HttpParams().set('page', page.toString());
    if(filters.name) params = params.set('name', filters.name);
    if(filters.episode) params = params.set('episode', filters.episode);

    this.http.get(`https://rickandmortyapi.com/api/episode`, { params })
      .pipe(
        delay(3000),
        finalize(() => { this.isLoading = false; this.showLoader = true; })
      )
      .subscribe({
        next: (data: any) => {
          this.episodes = data.results;
          this.totalPages = data.info.pages;
          this.currentPage = page;
          loadingPromise.then(() => {
            this.isLoading = false;
            this.showLoader = true;
          });
        },
        error: (err) => {
          this.episodes = [];
          this.totalPages = 1;
          loadingPromise.then(() => {
            this.isLoading = false;
            this.showLoader = true;
          });
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
    this.selectedEpisode = null;
  }

  // Mobil dokunmatik kontrolü
  handleTouch(event: TouchEvent): void {
    if (this.selectedLocation) {
      event.preventDefault();
      this.closeModal();
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(filters: any): void {
    console.log('Uygulanan filtreler:', filters);
    // Örnek:
    this.currentPage = 1;
    this.loadData();
  }

  applyCharacterFilters(filters: any): void {
    if(this.currentView === 'characters') {
      this.currentPage = 1;
      this.loadCharacters(1, filters);
    }
  }

  applyLocationFilters(filters: any): void {
    if(this.currentView === 'locations') {
      this.currentPage = 1;
      this.loadLocations(1, filters);
    }
  }

  applyEpisodeFilters(filters: any): void {
    const params: any = {};
    
    // Name filtresi
    if(filters.name?.trim()) params.name = filters.name.trim();

    // Episode filtresi
    if(filters.season) {
      const seasonCode = `S${filters.season.padStart(2, '0')}`;
      
      if(filters.episode) {
        params.episode = `${seasonCode}E${filters.episode.padStart(2, '0')}`;
      } else {
        params.episode = seasonCode; // Sadece sezon seçilirse
      }
    } else if(filters.episode) {
      params.episode = `E${filters.episode.padStart(2, '0')}`;
    }

    this.loadEpisodes(1, params);
  }

  private getSeasonFromEpisode(episode: number): number {
    return Math.floor((episode - 1) / 11) + 1;
  }

  private getEpisodeInSeason(episode: number): number {
    return ((episode - 1) % 11) + 1;
  }

  showEpisodeDetails(episodeId: number): void {
    this.http.get(`https://rickandmortyapi.com/api/episode/${episodeId}`)
      .subscribe({
        next: async (episode: any) => {
          this.selectedEpisode = episode;
          await this.loadCharacterNames(episode.characters);
        },
        error: (err) => {
          this.errorMessage = 'Bölüm detayları yüklenemedi!';
          console.error('Hata:', err);
        }
      });
  }

  private async loadCharacterNames(characterUrls: string[]): Promise<void> {
    const ids = characterUrls.map(url => url.split('/').pop());
    const uniqueIds = [...new Set(ids)];
    
    try {
      const response: any = await this.http.get(
        `https://rickandmortyapi.com/api/character/${uniqueIds.join(',')}`
      ).toPromise();

      const characters = Array.isArray(response) ? response : [response];
      characters.forEach(char => {
        this.characterNames[char.id] = char.name;
      });
    } catch (err) {
      console.error('Karakter isimleri yüklenemedi:', err);
    }
  }

  getCharacterName(characterUrl: string): string {
    const id = characterUrl.split('/').pop();
    return this.characterNames[id!] || 'Yükleniyor...';
  }

  getCharacterImage(characterUrl: string): string {
    const id = characterUrl.split('/').pop();
    return `https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`;
  }

  formatEpisode(episodeCode: string): string {
    const matches = episodeCode.match(/S(\d+)E(\d+)/);
    return matches ? `Season ${parseInt(matches[1])} • Episode ${parseInt(matches[2])}` : episodeCode;
  }

  formatAirDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  resetFilters() {
    this.isResettingFilters = true;
    this.showLoader = false;
    
    // 500ms sonra reset bayrağını kaldır (isteğin hızlı gelme durumu için)
    setTimeout(() => {
      this.isResettingFilters = false;
    }, 500);

    this.showLoader = false;
    setTimeout(() => {
      if (this.isLoading) this.showLoader = true;
    }, 2000);
  }

  // Hata gösterimini geciktiren metod
  private showDelayedError() {
    clearTimeout(this.errorTimer); // Önceki timer'ı temizle
    this.showErrorDelayed = false;
    
    this.errorTimer = setTimeout(() => {
      this.showErrorDelayed = true;
    }, 1500);
  }

  ngOnDestroy() {
    clearTimeout(this.errorTimer);
  }
}
