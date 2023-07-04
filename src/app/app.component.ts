import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren
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
  title = 'pin';
  isSecretMode = false; // isSecretMode = true is secret mode
  @ViewChildren('input') inputsList!: QueryList<ElementRef>;

  codeLength!: number; // allow change length of Pin
  regexValidate = /^[0-9]+$/; // allow change  regex for check input

  defaultValue?: string | number;

  pinResult?: string | number;
  public arrayPinInput: number[] = [];

  private inputs: HTMLInputElement[] = [];
  private inputsStates: InputState[] = [];
  private inputsListSubscription!: Subscription;

  private state = {
    isFocusingAfterAppearingCompleted: false,
    isInitialFocusFieldEnabled: true,
  };

  constructor() {
    this.codeLength = 4; // allow change length of Pin
  }

  ngOnInit(): void {
    this.onCodeLengthChanges();
  }

  ngAfterViewInit(): void {
    this.inputsListSubscription = this.inputsList.changes.subscribe(
      this.onInputsListChanges.bind(this)
    );
    this.onInputsListChanges(this.inputsList);
  }

  ngAfterViewChecked(): void {
    this.focusOnInput();
  }

  ngOnDestroy(): void {
    if (this.inputsListSubscription) {
      this.inputsListSubscription.unsubscribe();
    }
  }

  onInputChange(e: any, i: number): void {
    const target = e.target;
    const value = e.data || target.value;

    if (this.isEmpty(value)) {
      return;
    }

    if (!this.validateValue(value)) {
      e.preventDefault();
      e.stopPropagation();
      this.setInputValue(target, null);
      this.setStateForInput(target, InputState.reset);
      return;
    }

    const values = value.toString().trim().split('');
    for (let j = 0; j < values.length; j++) {
      const index = j + i;
      if (index > this.codeLength - 1) {
        break;
      }

      this.setInputValue(this.inputs[index], values[j]);
    }
    this.pinChanges();

    const next = i + values.length;
    if (next > this.codeLength - 1) {
      target.blur();
      return;
    }

    this.inputs[next].focus();
  }

  onPaste(e: ClipboardEvent, i: number): void {
    e.preventDefault();
    e.stopPropagation();

    const data = e.clipboardData
      ? e.clipboardData.getData('text').trim()
      : undefined;

    if (this.isEmpty(data)) {
      return;
    }

    const values = data!.split('');
    let valIndex = 0;

    for (let j = i; j < this.inputs.length; j++) {
      if (valIndex === values.length) {
        break;
      }

      const input = this.inputs[j];
      const val = values[valIndex];

      if (!this.validateValue(val)) {
        this.setInputValue(input, null);
        this.setStateForInput(input, InputState.reset);
        return;
      }

      this.setInputValue(input, val.toString());
      valIndex++;
    }

    this.inputs[i].blur();
    this.pinChanges();
  }

  async onKeydown(e: any, i: number): Promise<void> {
    const target = e.target;
    const isTargetEmpty = this.isEmpty(target.value);
    const prev = i - 1;

    const isBackspaceKey = await this.checkUserBackKey(e);
    const isDeleteKey = this.isUseDeleteKey(e);
    if (!isBackspaceKey && !isDeleteKey) {
      return;
    }

    e.preventDefault();

    this.setInputValue(target, null);
    if (!isTargetEmpty) {
      this.pinChanges();
    }

    if (prev < 0 || isDeleteKey) {
      return;
    }

    if (isTargetEmpty) {
      this.inputs[prev].focus();
    }
  }

  private onInputCodeChanges(): void {
    if (!this.inputs.length) {
      return;
    }

    if (this.isEmpty(this.defaultValue)) {
      this.inputs.forEach((input: HTMLInputElement) => {
        this.setInputValue(input, null);
      });
      return;
    }

    const chars = this.defaultValue!.toString().trim().split('');
    let isAllCharsAreAllowed = true;
    for (const char of chars) {
      if (!this.validateValue(char)) {
        isAllCharsAreAllowed = false;
        break;
      }
    }

    this.inputs.forEach((input: HTMLInputElement, index: number) => {
      const value = isAllCharsAreAllowed ? chars[index] : null;
      this.setInputValue(input, value);
    });
  }
  private setInputValue(input: HTMLInputElement, value: any): void {
    const isEmpty = this.isEmpty(value);
    if (isEmpty) {
      input.value = '';
    } else {
      input.value = value;
    }
  }

  private onCodeLengthChanges(): void {
    if (!this.codeLength) {
      return;
    }

    if (this.codeLength > this.arrayPinInput.length) {
      const numbers = Array(this.codeLength - this.arrayPinInput.length).fill(
        1
      );
      this.arrayPinInput.splice(this.arrayPinInput.length - 1, 0, ...numbers);
    } else if (this.codeLength < this.arrayPinInput.length) {
      this.arrayPinInput.splice(this.codeLength);
    }
  }

  private onInputsListChanges(list: QueryList<ElementRef>): void {
    if (list.length > this.inputs.length) {
      const inputsToAdd = list.filter(
        (item, index) => index > this.inputs.length - 1
      );
      this.inputs.splice(
        this.inputs.length,
        0,
        ...inputsToAdd.map((item) => item.nativeElement)
      );
      const states = Array(inputsToAdd.length).fill(InputState.ready);
      this.inputsStates.splice(this.inputsStates.length, 0, ...states);
    } else if (list.length < this.inputs.length) {
      this.inputs.splice(list.length);
      this.inputsStates.splice(list.length);
    }

    this.onInputCodeChanges();
  }

  private focusOnInput(): void {
    if (!this.state.isInitialFocusFieldEnabled) {
      return;
    }

    if (this.state.isFocusingAfterAppearingCompleted) {
      return;
    }

    this.inputs[0].focus();
    this.state.isFocusingAfterAppearingCompleted =
      document.activeElement === this.inputs[0];
  }

  private pinChanges(): void {
    setTimeout(() => {
      let code = '';

    for (const input of this.inputs) {
      if (!this.isEmpty(input.value)) {
        code += input.value;
      }
    }
      if (code.length >= this.codeLength) {
        this.pinResult = code;
        alert(`Your Pin enter is :  ${this.pinResult}`);
      }
    }, 50);
  }

  private validateValue(value: any): boolean {
    if (this.isEmpty(value)) {
      return false;
    }

    const isValid = this.regexValidate.test(value.toString());
    return isValid;
  }

  private setStateForInput(input: HTMLInputElement, state: InputState): void {
    const index = this.inputs.indexOf(input);
    if (index < 0) {
      return;
    }

    this.inputsStates[index] = state;
  }
  
  private checkUserBackKey(e: any): Promise<boolean> {
    const isBackspaceKey =
      (e.key && e.key.toLowerCase() === 'backspace') ||
      (e.keyCode && e.keyCode === 8);
    if (isBackspaceKey) {
      return Promise.resolve(true);
    }

    if (!e.keyCode || e.keyCode !== 229) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const input = e.target;
        resolve(input.selectionStart === 0);
      });
    });
  }

  private isUseDeleteKey(e: any): boolean {
    return (
      (e.key && e.key.toLowerCase() === 'delete') ||
      (e.keyCode && e.keyCode === 46)
    );
  }

  private isEmpty(value: any): boolean {
    return value === null || value === undefined || !value.toString().length;
  }

}
