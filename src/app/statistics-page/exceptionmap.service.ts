import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ExceptionMapService {
  private exceptionMapCache$: Observable<{[key: string]: string[]}> | null = null;

  constructor(private http: HttpClient) {}

  getExceptionMap(): Observable<{[key: string]: string[]}> {
    if (!this.exceptionMapCache$) {
      this.exceptionMapCache$ = this.http.get<any>('/assets/js/exceptions.json').pipe(
        map(response => {
          let exceptionMap: {[key: string]: string[]} = {};
          
          if (response) {
            exceptionMap = response;
          }
          return exceptionMap;
        }),
        shareReplay(1)
      );
    }
    
    return this.exceptionMapCache$;
  }

}