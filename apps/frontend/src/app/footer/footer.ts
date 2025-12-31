import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  // Anpassen für dein Projekt
  readonly currentYear = new Date().getFullYear();
  readonly name = 'Adem Dokur';
  readonly githubUrl = 'https://github.com/Ademdkr';
  readonly email = 'kontakt@ademdokur.dev';
}
