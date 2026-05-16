import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TeamBoardComponent } from './features/team-builder/team-board/team-board.component';

@Component({
  selector: 'app-root',
  imports: [TeamBoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
