import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpProgressEvent, HttpXsrfTokenExtractor } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import {AppComponent} from '../app.component';

@Injectable()
export class AppInterceptorsService implements HttpInterceptor {
  loadingTimeout = 30000
  app: AppComponent = null
  constructor() {}

  setAppComponent(appComponent: AppComponent) {this.app = appComponent}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(req).do(event => {
      }, (err: any) => {
        this.app.addMessage('error occured', '', 5000)
        console.log(err)
      }, () => {
        clearTimeout(this.loadingTimeout);
      });
  }

}
