import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="nav-container">
      <button 
        *ngFor="let tab of tabs" 
        [class.active]="activeTab === tab.toLowerCase()"
        (click)="switchTab(tab.toLowerCase())">
        {{ tab }}
      </button>
    </nav>
  `,
  styles: [`
    .nav-container {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin: 2rem 0;
    }
    button {
      padding: 1rem 1.5rem;
      border: none;
      border-radius: 10px;
      background: #f0f0f0;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
      color:rgb(4, 78, 45);
    }
    button.active {
      background: #42b983;
      color:rgb(255, 255, 255);
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    button:hover:not(.active) {
      background: #e0e0e0;
    }
  `]
})
export class NavigationComponent {
  tabs = ['Characters', 'Locations', 'Episodes'];
  activeTab = 'characters';
  
  @Output() tabSelected = new EventEmitter<string>();

  switchTab(tab: string) {
    this.activeTab = tab;
    this.tabSelected.emit(tab);
  }
}
