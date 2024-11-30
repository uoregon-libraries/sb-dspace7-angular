import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RelationMapService {
  private relationMapCache$: Observable<{[key: string]: string[]}> | null = null;

  constructor(private http: HttpClient) {}

    getRelationMap(): Observable<{ [key: string]: string[] }> {
        if (!this.relationMapCache$) {
            this.relationMapCache$ = this.http.get<any>('assets/data/all-relations.json').pipe(
                map(response => {
                    const relationMap: { [key: string]: string[] } = {};

                    if (response.response.docs) {
                        const relations = response.response.docs;
                        for (let i = 0; i < relations.length; i++) {
                            const parent = relations[i]['location.parent'];
                            const resourceid = relations[i]['search.resourceid'];

                            if (parent) {
                                if (typeof (relationMap[parent]) === 'undefined') {
                                    relationMap[parent] = [resourceid];
                                } else {
                                    relationMap[parent].push(resourceid);
                                }
                            }
                        }
                    }
                    return relationMap;
                }),
                // shareReplay(1)
            );
        }
    
    return this.relationMapCache$;
  }

}