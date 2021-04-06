import { Injectable } from '@angular/core';
import { Subscriber,Subject,Observable } from 'rxjs';

@Injectable()
export class DropdownService {

  private subject = new Subject<any>();
  constructor() {
      Observable.fromEvent(document, 'click').subscribe((event: any) => {
          this.subject.next(event.target);
      });
  }
  getAppClick(): Observable<any> {
      return this.subject.asObservable();
  }
}
