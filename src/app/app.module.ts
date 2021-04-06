import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DropdownComponent } from './dropdown/dropdown.component'
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {FormsModule} from "@angular/forms";
import {AutoCompleteModule, CheckboxModule, DataTableModule, DialogModule, DropdownModule, SharedModule, TooltipModule} from 'primeng/primeng';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AceEditorModule } from 'ng2-ace-editor';
import { CodeViewerComponent } from './code-viewer/code-viewer.component';
import {NodeStylingComponent} from './node-styling/node-styling.component';
import {AppInterceptorsService} from './services/AppInterceptorService';
import { SaveLoadService } from './services/SaveLoadService';
import { PropertiesPipe } from './pipes/appProperties';

import { ArrayFilterPipe } from './dropdown/filter-by.pipe';
import { LimitToPipe } from './dropdown/limit-to.pipe';


@NgModule({
  declarations: [
    AppComponent,
    CodeViewerComponent,
    NodeStylingComponent,
    PropertiesPipe,
    DropdownComponent,
    ArrayFilterPipe,
    LimitToPipe,
    
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    DropdownModule,
    TooltipModule,
    BrowserModule,
    BrowserAnimationsModule,
    DialogModule,
    DataTableModule,
    SharedModule,
    AutoCompleteModule,
    CheckboxModule,
    AceEditorModule
  ],
  exports: [
  ],
  providers: [AppInterceptorsService, SaveLoadService, {
    provide: HTTP_INTERCEPTORS,
    useExisting: AppInterceptorsService,
    multi: true,
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
