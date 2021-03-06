import {Component, EventEmitter, forwardRef, Input, Output} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

import {ButtonAttributesCollection} from '../models/button-attributes-collection.model';
import {Digit} from '../models/digit.model';
import {LockOptions} from '../models/lock-options.model';
import {Ionic4PhoneSpinnerOptions} from '../models/ionic4-phone-spinner.model';
import {ButtonOptions} from '../models/button-options.model';

@Component({
  selector:    'ionic4-phone-spinner',
  templateUrl: './ionic4-phone-spinner.component.html',
  styleUrls: [
    './ionic4-phone-spinner.component.scss'
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Ionic4PhoneSpinnerComponent),
      multi: true
    }
  ]
})
export class Ionic4PhoneSpinnerComponent implements ControlValueAccessor {
  public settings:Ionic4PhoneSpinnerOptions = new Ionic4PhoneSpinnerOptions();

  public buttons:ButtonAttributesCollection = new ButtonAttributesCollection();
  public defaultButtons:ButtonAttributesCollection = new ButtonAttributesCollection();

  public buttonTextOptions = [
    'shuffle',
    'restart',
    'unlock'
  ];

  public previousPositions = this.buttonTextOptions;

  public fullNumber:string = '0000000000';
  public numbers:Digit[] = [];

  public disabled:boolean = false;
  public isRandomizing:boolean = false;

  private _onTouched:() => void;
  private _propagateChange:any = () => {};

  @Input()
  set options(settings:Ionic4PhoneSpinnerOptions) {
    this.settings = settings;

    this.updateButtonOptionsContinuously();
  }

  @Input()
  set number(digits:string) {
    const candidates = digits.split('');

    for (let i = 0; i < 10; i++) {
      const digit = new Digit();
      if (typeof candidates[i] !== 'undefined') {
        digit.value = parseInt(candidates[i], 10);
      }

      this.numbers.push(digit);
    }
  }

  @Output() change:EventEmitter<string>;

  constructor() {
    this.change = new EventEmitter<string>();
  }

  // ControlValueAccessor Requirements
  private _onChange():void {
    this.fullNumber = '';
    for (let i = 0; i < 10; i++) {
      this.fullNumber += '' + this.numbers[i].value;
    }

    this._propagateChange(this.fullNumber);
    this.change.emit(this.fullNumber);
  }

  writeValue(value:string):void {
    this.fullNumber = value || '0000000000';
  }

  registerOnChange(fn:any):void {
    this._propagateChange = fn;
  }

  registerOnTouched(fn:any):void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled:boolean):void {
    this.disabled = isDisabled;
  }

  // Functions

  getRandomItem(array:any[]) {
    return array[Math.round(Math.random() * (array.length - 1))];
  }

  clearLocks():void {
    for (let i = 0; i < 10; i++) {
      this.numbers[i].isLocked = false;
      this.numbers[i].isCorrectColor = this.getIsLiar(i);
      this.numbers[i].isCorrectIcon = this.getIsLiar(i);
    }

    if (this.settings.buttons.indexOf(ButtonOptions.CHANGE_AFTER_UNLOCK_ALL) !== -1) {
      this.updateButtons();
    }
  }

  getButtonColor(button):number {
    return this.buttons[button].color;
  }

  getButtonFill(button):number {
    return this.buttons[button].fill;
  }

  getButtonIcon(button):number {
    return this.buttons[button].icon;
  }

  getButtonPush(button):number {
    return this.buttons[button].push;
  }

  getButtonSize(button):number {
    return this.buttons[button].size;
  }

  getButtonText(button):number {
    return this.buttons[button].text;
  }

  getIsLiar(i:number):boolean {
    let showCorrectIcon = true;

    if (Math.random() < 0.20) {
      if (this.numbers[i].isLocked === true && this.settings.locks.indexOf(LockOptions.LIAR) !== -1) {
        showCorrectIcon = !this.numbers[i].isLocked;
      } else if (this.numbers[i].isLocked === false && this.settings.unlocks.indexOf(LockOptions.LIAR) !== -1) {
        showCorrectIcon = !this.numbers[i].isLocked;
      }
    }

    return showCorrectIcon;
  }

  randomize():void {
    for (let i = 0; i < 10; i++) {
      if (this.numbers[i].isLocked === false) {
        this.randomizeDigit(i);
      }
    }

    if (this.settings.buttons.indexOf(ButtonOptions.CHANGE_AFTER_SHUFFLE) !== -1) {
      this.updateButtons();
    }
  }

  randomizeDigit(i:number, increment?:number):void {
    this.isRandomizing = true;

    this.numbers[i].randomize();

    if (typeof increment === 'undefined') {
      increment = this.settings.shufflesPerClick;
    }

    if (increment !== 0) {
      increment--;

      setTimeout(
        () => {
          this.randomizeDigit(i, increment);
        },
        this.settings.shuffleMilliseconds
      );
    } else {
      this.isRandomizing = false;

      const shuffleLock = this.settings.locks.indexOf(LockOptions.SHUFFLE) !== -1;
      const shuffleUnlock = this.settings.unlocks.indexOf(LockOptions.SHUFFLE) !== -1;
      if (shuffleLock || shuffleUnlock) {
        for (let j = 0; j < 10; j++) {
          if (this.numbers[j].isLocked === false && shuffleLock) {
            this.numbers[j].isLocked = true;
          } else if (this.numbers[j].isLocked === true && shuffleUnlock) {
            this.numbers[j].isLocked = false;
          }

          this.numbers[j].isCorrectColor = this.getIsLiar(i);
          this.numbers[j].isCorrectIcon = this.getIsLiar(i);
        }
      }
    }
  }

  reset():void {
    this.clearLocks();
    this.randomize();
  }

  restart():void {
    this.reset();

    if (this.settings.buttons.indexOf(ButtonOptions.CHANGE_AFTER_RESTART) !== -1) {
      this.updateButtons();
    }
  }

  shuffleArray(array:any[]):any[] {
    let currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  toggleLock(i:number):void {
    // TODO: Add modal
    this.updateLock(i);
  }

  updateButtons():void {
    this.buttonTextOptions.forEach(
      (button) => {
        this.updateButtonColor(button);
        this.updateButtonFill(button);
        this.updateButtonIcon(button);
        this.updateButtonSizes();
        this.updateButtonText(button);
      }
    );
  }

  updateButtonColor(button:string):void {
    if (this.settings.buttons.indexOf(ButtonOptions.UPDATE_COLOR) !== -1) {
      const changeColor = Math.random() < 0.3;
      if (changeColor) {
        let colors = ['success', 'warning', 'danger'];

        if (this.settings.buttons.indexOf(ButtonOptions.ALLOW_RANDOM_COLORS) !== -1) {
          colors = colors.concat(
              ['primary', 'secondary', 'tertiary', 'light', 'medium', 'dark']
          );
        }

        this.buttons[button].color = this.getRandomItem(colors);
      } else {
        this.buttons[button].color = this.defaultButtons[button].color;
      }
    }
  }

  updateButtonFill(button:string):void {
    if (this.settings.buttons.indexOf(ButtonOptions.UPDATE_FILL) !== -1) {
      const changeFill = Math.random() < 0.3;
      if (changeFill) {
        const colors = ['clear', 'outline', 'solid'];

        this.buttons[button].fill = this.getRandomItem(colors);
      } else {
        this.buttons[button].fill = this.defaultButtons[button].fill;
      }
    }
  }

  updateButtonIcon(button:string):void {
    if (this.settings.buttons.indexOf(ButtonOptions.UPDATE_ICON) !== -1) {
      const changeIcon = Math.random() < 0.3;
      if (changeIcon) {
        let icons = ['key', 'shuffle', 'nuclear'];

        if (this.settings.buttons.indexOf(ButtonOptions.ALLOW_RANDOM_ICONS) !== -1) {
          icons = icons.concat(
              [
                'airplane', 'alarm', 'american-football', 'baseball', 'basketball', 'beer', 'bicycle', 'build', 'bug', 'cart',
                'cloud', 'color-fill', 'flash', 'flask', 'happy', 'heart', 'help-buoy', 'ice-cream', 'medal', 'lock',
                'microphone', 'moon', 'notifications', 'nutrition', 'pin', 'sad', 'save', 'snow', 'train', 'wine'
              ]
          );
        }

        this.buttons[button].icon = this.getRandomItem(icons);
      } else {
        this.buttons[button].icon = this.defaultButtons[button].icon;
      }
    }
  }

  updateButtonPositions(force?:boolean):void {
    if (force || this.settings.buttons.indexOf(ButtonOptions.UPDATE_POSITION) !== -1) {
      const changePosition = Math.random() < 1.2;
      if (changePosition) {
        let options;
        if (force) {
          options = this.previousPositions;
        } else {
          options = this.shuffleArray(this.buttonTextOptions);
        }

        this.previousPositions = options;

        for (let i = 0; i < 3; i++) {
          const button = options[i];

          if (i === 0 && button === 'shuffle') {
            this.buttons[button].push = 0;
          } else if (i === 1 && button === 'shuffle') {
            this.buttons[button].push = this.buttons[options[0]].size;
          } else if (i === 2 && button === 'shuffle') {
            this.buttons[button].push = this.buttons[options[0]].size + this.buttons[options[1]].size;
          } else if (i === 0 && button === 'unlock') {
            this.buttons[button].push = -1 * this.buttons['shuffle'].size;
          } else if (i === 1 && button === 'unlock') {
            this.buttons[button].push = (-1 * this.buttons['shuffle'].size) + this.buttons[options[0]].size;
          } else if (i === 2 && button === 'unlock') {
            this.buttons[button].push = this.buttons['restart'].size;
          } else if (i === 0 && button === 'restart') {
            this.buttons[button].push = -1 * (this.buttons['unlock'].size + this.buttons['shuffle'].size);
          } else if (i === 1 && button === 'restart') {
            this.buttons[button].push = (-1 * (this.buttons['shuffle'].size + this.buttons['unlock'].size)) + this.buttons[options[0]].size;
          } else if (i === 2 && button === 'restart') {
            this.buttons[button].push = 0;
          }  else {
            console.error('Unplanned for position.')
          }
        }
      }
    }
  }

  updateButtonSizes():void {
    if (this.settings.buttons.indexOf(ButtonOptions.UPDATE_SIZE) !== -1) {
      const changeSize = Math.random() < 0.2;
      if (changeSize) {
        this.buttonTextOptions.forEach(
            (button) => {
              const sizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

              this.buttons[button].size = this.getRandomItem(sizes);
            }
        );

        let totalSize = 0;
        this.buttonTextOptions.forEach(
            (buttonTitle) => {
              totalSize += this.buttons[buttonTitle].size;
            }
        );

        while (totalSize > 12) {
          totalSize--;

          const toBeReduced = this.getRandomItem(this.buttonTextOptions);

          if (this.buttons[toBeReduced].size > 1) {
            this.buttons[toBeReduced].size = this.buttons[toBeReduced].size - 1;
          }
        }
      }

      this.updateButtonPositions(true);
    }

    this.updateButtonPositions();
  }

  updateButtonText(button:string):void {
    if (this.settings.buttons.indexOf(ButtonOptions.UPDATE_TEXT) !== -1) {
      let changeText = Math.random() < 0.15;
      if (changeText) {
        this.buttons[button].text = this.getRandomItem(this.buttonTextOptions);
      } else {
        this.buttons[button].text = this.defaultButtons[button].text;
      }
    }
  }

  updateButtonOptionsContinuously():void {
    if (this.settings.buttons.indexOf(ButtonOptions.CHANGE_CONTINUOUSLY) !== -1) {
      let seconds = Math.random() * 10000;
      if (seconds < 3000) {
        seconds = 3000;
      }

      setTimeout(
          () => {
            this.updateButtons();
            this.updateButtonOptionsContinuously();
          },
          seconds
      );
    }
  }

  updateLock(i:number):void {
    let canChange = true;
    if (i !== 0) {
      if (this.settings.locks.indexOf(LockOptions.ORDER) !== -1) {
        if (i !== 0) {
          if (this.numbers[i - 1].isLocked === false) {
            canChange = false;
          }
        }
      }

      if (this.settings.unlocks.indexOf(LockOptions.ORDER) !== -1) {
        if (i !== 0) {
          if (this.numbers[i - 1].isLocked === true) {
            canChange = false;
          }
        }
      }
      if (this.settings.locks.indexOf(LockOptions.REVERSE) !== -1) {
        if (i + 1 < this.numbers.length) {
          if (this.numbers[i + 1].isLocked === false) {
            canChange = false;
          }
        }
      }

      if (this.settings.unlocks.indexOf(LockOptions.REVERSE) !== -1) {
        if (i + 1 < this.numbers.length) {
          if (this.numbers[i + 1].isLocked === true) {
            canChange = false;
          }
        }
      }
    }

    if (Math.random() < 0.5) {
      if (this.numbers[i].isLocked && this.settings.unlocks.indexOf(LockOptions.IGNORE) !== -1) {
        canChange = false;
      }

      if (!this.numbers[i].isLocked && this.settings.locks.indexOf(LockOptions.IGNORE) !== -1) {
        canChange = false;
      }
    }

    if (canChange) {
      if (Math.random() < 0.20) {
        if (this.numbers[i].isLocked === true && this.settings.locks.indexOf(LockOptions.DIFFERENT) !== -1) {
          i = Math.round(Math.random() * 10);
        } else if (this.numbers[i].isLocked === false && this.settings.unlocks.indexOf(LockOptions.DIFFERENT) !== -1) {
          i = Math.round(Math.random() * 10);
        }
      }

      this.numbers[i].toggleIsLocked();

      if (
          this.numbers[i].isLocked && this.settings.buttons.indexOf(ButtonOptions.CHANGE_AFTER_LOCK) !== -1 ||
          !this.numbers[i].isLocked && this.settings.buttons.indexOf(ButtonOptions.CHANGE_AFTER_UNLOCK) !== -1
      ) {
        this.updateButtons();
      }

      if (Math.random() < 0.25) {
        if (this.numbers[i].isLocked) {
          if (this.settings.unlocks.indexOf(LockOptions.REVERT) !== -1) {
            setTimeout(
                () => {
                  this.numbers[i].isLocked = false;
                },
                Math.random() * 1000 * 3
            );
          }
        } else {
          if (this.settings.locks.indexOf(LockOptions.REVERT) !== -1) {
            setTimeout(
                () => {
                  this.numbers[i].isLocked = true;
                },
                Math.random() * 1000 * 60
            );
          }
        }
      }

      this.numbers[i].isCorrectColor = this.getIsLiar(i);
      this.numbers[i].isCorrectIcon = this.getIsLiar(i);

      this._onChange();
    }
  }
}
