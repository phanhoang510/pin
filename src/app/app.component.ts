import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Subscription } from 'rxjs';

enum InputState {
  ready = 0,
  reset = 1,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  digitalRegex = /^[0-9]+$/;
  characterOnlyRegex = /^[A-Za-z]+$/;
  title = 'pin';

  constructor() {}

  ngOnInit(): void {}
  getPin(pin: string) {
    alert(`Your Pin enter is :  ${pin}`);
  }
}
