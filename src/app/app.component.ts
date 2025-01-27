import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Character {
  id: number;
  name: string;
  status: string;
  species: string;
  image: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  characters: Character[] = [];
  currentPage = 1;
  totalPages = 1;

  constructor(private http: HttpClient) {
    this.loadCharacters();
  }

  loadCharacters(page: number = 1) {
    const apiUrl = `https://rickandmortyapi.com/api/character?page=${page}`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        this.characters = response.results;
        this.totalPages = response.info.pages;
        this.currentPage = page;
      },
      error: (err) => console.error('API Hatası:', err)
    });
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.loadCharacters(newPage);
    }
  }
}
