import { AutoCompleterModule } from './auto-completer/auto-completer.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AutoCompleterModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
