import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';

import { AutoCompleterItem } from '..';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements Highlightable {
  private _isActive = false;

  @Input() item: AutoCompleterItem;
  @Input() disabled = false;
  @Output() itemSelected = new EventEmitter<AutoCompleterItem>();

  constructor() { }

  public get isActive() {
    return this._isActive;
  }

  public selectItem() {
    this.itemSelected.emit(this.item);
  }

  setActiveStyles(): void {
    this._isActive = true;
  }

  setInactiveStyles(): void {
    this._isActive = false;
  }
}
