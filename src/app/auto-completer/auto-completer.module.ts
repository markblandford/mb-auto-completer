import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { AutoCompleterComponent } from './auto-completer.component';
import { ListItemModule } from './list-overlay-handler/list-item/list-item.module';

@NgModule({
  declarations: [
    AutoCompleterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    OverlayModule,
    PortalModule,
    ListItemModule
  ],
  exports: [
    AutoCompleterComponent
  ]
})
export class AutoCompleterModule { }
