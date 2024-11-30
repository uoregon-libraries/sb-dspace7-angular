import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsChartComponent } from './statistics-chart.component';
import { UsageReport } from '../../core/statistics/models/usage-report.model';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { DSpaceObjectDataService } from '../../core/data/dspace-object-data.service';
import { DSONameService } from '../../core/breadcrumbs/dso-name.service';

describe('StatisticsChartComponent', () => {

  let component: StatisticsChartComponent;
  let de: DebugElement;
  let fixture: ComponentFixture<StatisticsChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
      ],
      declarations: [
        StatisticsChartComponent,
      ],
      providers: [
        { provide: DSpaceObjectDataService, useValue: {} },
        { provide: DSONameService, useValue: {} },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatisticsChartComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    component.report = Object.assign(new UsageReport(), {
      points: [],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('when the storage report is empty', () => {

    it ('should not display a chart', () => {
      expect(de.query(By.css('chart'))).toBeNull();
    });
  });

  describe('when the storage report has data', () => {

    beforeEach(() => {
      component.report = Object.assign(new UsageReport(), {
        points: [
          {
            id: 'item_1',
            values: {
              views: 7,
              downloads: 4,
            },
          },
          {
            id: 'item_2',
            values: {
              views: 8,
              downloads: 8,
            },
          }
        ]
      });
      component.ngOnInit();
      fixture.detectChanges();
    });

    it ('should display a chart with the correct data', () => {

      expect(de.query(By.css('chart'))).toBeTruthy();

      expect(de.query(By.css('th.views-header')).nativeElement.innerText)
        .toEqual('views');
      expect(de.query(By.css('th.downloads-header')).nativeElement.innerText)
        .toEqual('downloads');

      expect(de.query(By.css('td.item_1-views-data')).nativeElement.innerText)
        .toEqual('7');
      expect(de.query(By.css('td.item_1-downloads-data')).nativeElement.innerText)
        .toEqual('4');
      expect(de.query(By.css('td.item_2-views-data')).nativeElement.innerText)
        .toEqual('8');
      expect(de.query(By.css('td.item_2-downloads-data')).nativeElement.innerText)
        .toEqual('8');
    });
  });
});
