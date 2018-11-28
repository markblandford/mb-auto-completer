import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { ListItemComponent } from './list-item/list-item.component';
import { AutoCompleterComponent } from './auto-completer.component';

@NgModule({
  declarations: [
    ListItemComponent,
    AutoCompleterComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    OverlayModule,
    PortalModule
  ],
  exports: [
    AutoCompleterComponent
  ]
})
export class AutoCompleterModule { }
