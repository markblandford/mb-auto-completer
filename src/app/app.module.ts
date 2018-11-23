import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AutoCompleterComponent } from './auto-completer/auto-completer.component';
import { ListItemComponent } from './auto-completer/list-item/list-item.component';

@NgModule({
  declarations: [
    AppComponent,
    AutoCompleterComponent,
    ListItemComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    OverlayModule,
    PortalModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
