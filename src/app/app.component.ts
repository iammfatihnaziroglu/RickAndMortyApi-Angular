import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FiltersComponent } from "./filters/filters.component";
import { of, catchError, switchMap } from 'rxjs';
import { Router } from '@angular/router';

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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FiltersComponent
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

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadCharacters();
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
      this.loadCharacters(newPage);
    }
  }

  showCharacterDetails(id: number) {
    this.http.get<Character>(`https://rickandmortyapi.com/api/character/${id}`)
      .subscribe({
        next: (char) => this.selectedCharacter = char,
        error: (err) => console.error('Detay hatası:', err)
      });
  }

  closeModal() {
    this.selectedCharacter = null;
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
}
