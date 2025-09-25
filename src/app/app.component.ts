import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./shared/navbar/navbar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'storybot';

  ngOnInit() {
  // your baseline DPI
  const baseline = 1.25; // you designed at 125 %
  const scale = baseline / window.devicePixelRatio;

  document.body.style.transformOrigin = '0 0';
  document.body.style.transform = `scale(${scale})`;
  document.body.style.width = `${(100 / scale)}%`;
  document.body.style.height = `${(100 / scale)}%`;
}

}
