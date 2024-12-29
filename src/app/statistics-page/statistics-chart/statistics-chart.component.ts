import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Point, UsageReport } from '../../core/statistics/models/usage-report.model';
import { combineLatest, forkJoin, Observable, of, throwError } from 'rxjs';
import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import { catchError, map } from 'rxjs/operators';
import { getRemoteDataPayload, getFinishedRemoteData, getFirstCompletedRemoteData } from '../../core/shared/operators';
import { DSpaceObjectDataService } from '../../core/data/dspace-object-data.service';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from '../../shared/empty.util';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import  * as L from 'leaflet';
import { icon, Marker } from 'leaflet';
import 'leaflet.markercluster';
import { HttpClient } from '@angular/common/http';

import * as historyOffsets from '../../../assets/js/historyoffsets.json';
import * as countrycodes from '../../../assets/js/country-codes.json';

// Import Angular core and Chart.js modules
import { Subscription } from 'rxjs';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { ResourceType } from '../../core/shared/resource-type';
import { ItemDataService } from '../../core/data/item-data.service';
import { Item } from '../../core/shared/item.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { RelationMapService } from '../relationmap.service';
import { ExceptionMapService } from '../exceptionmap.service';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

export interface TableViewData {
  title: string;
  views: number;
}
export interface TableDownloadData {
  title: string;
  downloads: number;
}
export interface TableAuthorViewData {
  name: string;
  pageviews: number;
}
export interface TableAuthorFileData {
  name: string;
  downloads: number;
}
/**
 * Component representing a statistics chart for a given usage reports.
 */
@Component({
  selector: 'ds-statistics-chart',
  templateUrl: './statistics-chart.component.html',
  styleUrls: ['./statistics-chart.component.scss']
})
export class StatisticsChartComponent implements OnInit, AfterViewInit, OnDestroy {

  /**
   * The usage reports to display a statistics chart for
   */
  @Input()
  reports: UsageReport[];

  @Input()
  scope: any;

  /**
   * Boolean indicating whether the usage reports has data
   */
  hasData: boolean;

  /**
   * The chart headers
   */
  headers: string[];

  spageviews: number;
  sdownloads: number;
  topCommunities: any = {};
  sitedownloads: any = {};
  sitepageviews: any = {};
  allcommunitiespageviews: any = {};
  allcommunitiesdownloads: any = {};
  topcommunitytitles: string[] = [];
  topcommunityids: string[] = [];
  topcommunitydownloads: number[] = [];
  topcommunitypageviews: number[] = [];
  allcommunitiespageviewsArray = [];
  allcommunitiesdownloadsArray = [];

  private owningCommMap: { [key: string]: number } = {};
  private offsets: any = (historyOffsets as any).default;
  private codenamepairs: any = (countrycodes as any).default;

  constructor(
    protected dsoService: DSpaceObjectDataService,
    protected nameService: DSONameService,
    private translateService: TranslateService,
    protected http: HttpClient,
    private itemService: ItemDataService,
    private cdr: ChangeDetectorRef,
    private relationMapService: RelationMapService,
    private exceptionMapService: ExceptionMapService,
  ) {

  }

  
ngOnDestroy(): void {
  // Clean up: Destroy the chart instance and unsubscribe from data loading
  if (this.chart1) {
    this.chart1.destroy();
  }
  if (this.dataSubscription1) {
    this.dataSubscription1.unsubscribe();
  }

  if (this.chart2) {
    this.chart2.destroy();
  }
  if (this.dataSubscription2) {
    this.dataSubscription2.unsubscribe();
  }

  if (this.chart3) {
    this.chart3.destroy();
  }
  if (this.dataSubscription3) {
    this.dataSubscription3.unsubscribe();
  }

  if (this.dataSubscriptionTb1) {
    this.dataSubscriptionTb1.unsubscribe();
  }

  if (this.itemCountSubscription) {
    this.itemCountSubscription.unsubscribe();
  }

  if (this.map) {
    this.map.remove();
  }
}

  ngOnInit() {

    this.exceptionMapService.getExceptionMap().subscribe(
      exceptionMap => this.exceptionMap = exceptionMap
    )
    this.relationMapService.getRelationMap().subscribe(
      relationMap => this.relationMap = relationMap
    );

    // this.getRelationMap();
    // this.loadfromcofig();

    if (this.scope.type === 'site') {
      this.loadDataTb1(this.scope);
      this.initSiteCountryDownloads(this.scope).then(() => this.useCountrydata());
      this.loadAllItemCount();
    } else if (this.scope.type === 'community' || this.scope.type === 'collection') {
      this.initSiteCountryDownloads(this.scope).then(() => this.useCountrydata());
      this.loadDataTb1(this.scope);
    } else if (this.scope.type === 'item') {
      this.loadReportsData();
      this.useCountrydata();  
    }
  }

  useCountrydata() {
    // Load GeoJSON data and apply it to the map
    this.http.get('assets/js/countries.geojson').subscribe((geoJsonData: any) => {
      this.createChoroplethLayer(geoJsonData);
      this.geoJsonData = geoJsonData;
    });
  }

  ngAfterViewInit(): void {
    if (this.scope.type === 'site') {
      // Load data and initialize the chart only after the view is ready
      this.loadData(this.scope).then(() => this.initializeChart1());
      this.loadDataFromFilesSite().then(() => this.initializeChart2());
      this.loadDataForDoughnut(this.scope).then(() => this.initializeChartDoughnut());
      this.initMap();
    } else if (this.scope.type === 'community' || this.scope.type === 'collection') {
      this.loadDataForDoughnut(this.scope).then(() => this.initializeChartDoughnut());
      this.loadData(this.scope).then(() => this.initializeChart1());
      this.loadDataFromFiles(this.scope).then(() => this.initializeChart2());
      this.initMap();
    } else if (this.scope.type === 'item') {
      this.initializeChartDoughnut();
      this.initializeChartViews();
      this.initMap();
    }
    this.initCountryCodeNames().then(() => this.countryTableData);

  }

////////////////////Read files////////////////////////////////

private chart1: Chart | null = null;
private dataSubscription1: Subscription | null = null;
public chartData1: number[] = []; // Array to store data for the chart
public labels1: string[] = []; // Array for chart label
public label6mon: string[] = [];
public chartData6monPageviews1: number[] = [];
public chartData6monDownloads1: number[] = [];
public relationMap: {[key: string]: string[]} = {};
public exceptionMap: {[key: string]: string[]} = {};
private dataSubscriptionRelationMap: Subscription | null = null;

// Helper method to process pageview counts
private processviewCounts(counts: number[], chartdata: number[]): void {
  for (let i = 0; i < counts.length; i += 2) {
    if(typeof(chartdata[i])==='undefined') {
      chartdata.push(counts[i+1]);
    } else {
      chartdata[i] += counts[i+1];
    }
  }
}

private async loadData(scope: any): Promise<void> {
  let dataFiles = [];
  if(scope.type==='site') {
    dataFiles = [
      'assets/data/site-pageviews-6months.json',
      'assets/data/site-downloads-6months.json'
    ];  
  } else if(scope.type==='community' || scope.type==='collection') {
    dataFiles = [
      `assets/data/${scope.id}/pageviews-6months.json`,
      `assets/data/${scope.id}/downloads-6months.json`
    ];
  }

  return new Promise((resolve) => {
    this.dataSubscription1 = forkJoin(
      dataFiles.map(file => this.http.get<any>(file))
    ).subscribe(responses => {
      responses.forEach((response, index) => {
        switch (index) {
          case 0: // pageviews-6months.json
            if (scope.type==='site') {
              if (response.facet_counts && response.facet_counts.facet_ranges && response.facet_counts.facet_ranges.time && response.facet_counts.facet_ranges.time.counts) {
                const counts = response.facet_counts.facet_ranges.time.counts;
                for (let i = 0; i < counts.length; i += 2) {
                  this.labels1.push(this.convertMonth(counts[i]));
                  this.chartData6monPageviews1.push(counts[i+1]);
                }
              }
            } else if (scope.type==='community' || scope.type==='collection') {
              if (response.facet_counts && response.facet_counts.facet_ranges && response.facet_counts.facet_ranges.time && response.facet_counts.facet_ranges.time.counts) {
                const counts = response.facet_counts.facet_ranges.time.counts;
                for (let i = 0; i < counts.length; i += 2) {
                  this.labels1.push(this.convertMonth(counts[i]));
                  this.chartData6monPageviews1.push(counts[i+1]);
                }
              }
              if(this.offsets.exceptionComCols.includes(scope.id)) {
                const additionalCounts = this.offsets.monthcounts[scope.id]['pageviews'];
                let k = 0;
                for (let i = 0; i < additionalCounts.length; i += 2) {
                  this.chartData6monPageviews1[k] = this.chartData6monPageviews1[k] + additionalCounts[i+1];
                  k++;
                }
              }
            }

            break;

          case 1: // downloads-6months.json
            if (scope.type==='site') {
              if (response.facet_counts && response.facet_counts.facet_ranges && response.facet_counts.facet_ranges.time && response.facet_counts.facet_ranges.time.counts) {
                const counts = response.facet_counts.facet_ranges.time.counts;
                for (let i = 0; i < counts.length; i += 2) {
                  this.chartData6monDownloads1.push(counts[i+1]);
                }
              }
            } else if (scope.type==='community' || scope.type==='collection') {
              if (response.facet_counts && response.facet_counts.facet_ranges && response.facet_counts.facet_ranges.time && response.facet_counts.facet_ranges.time.counts) {
                const counts = response.facet_counts.facet_ranges.time.counts;
                for (let i = 0; i < counts.length; i += 2) {
                  this.chartData6monDownloads1.push(counts[i+1]);
                }
              }
              if(this.offsets.exceptionComCols.includes(scope.id)) {
                const additionalCounts = this.offsets.monthcounts[scope.id]['downloads'];
                let k = 0;
                for (let i = 0; i < additionalCounts.length; i += 2) {
                  this.chartData6monDownloads1[k] = this.chartData6monDownloads1[k] + additionalCounts[i+1];
                  k++;
                }
              }
            }

            break;

          default:
            console.warn('Unexpected file structure');
        }
      });
      resolve();
    });
  });
}

convertMonth(datestr: string) {
  // const date = new Date(datestr);
  const datePipe = new DatePipe('en-US');
  // return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  return datePipe.transform(datestr, 'MMM yyyy') || '';
}

private initializeChart1(): void {
  const chartConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: this.labels1,
      datasets: [{
        label: 'Pageviews',
        data: this.chartData6monPageviews1,
        tension: 0.1,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Downloads',
        data: this.chartData6monDownloads1,
        tension: 0.1,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Pageviews and Downloads 6 Months'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }    
    }
  };

  // Set up the chart after data loading
  const ctx = document.getElementById('myChart') as HTMLCanvasElement;
  if (ctx) {
    this.chart1 = new Chart(ctx, chartConfig);
  }
}

private initializeChartViews(): void {
  const chartConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: this.labels1,
      datasets: [{
        label: 'Pageviews',
        data: this.chartData6monPageviews1,
        tension: 0.1,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Pageviews 6 Months'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }    
    }
  };

  // Set up the chart after data loading
  const ctx = document.getElementById('myChart') as HTMLCanvasElement;
  if (ctx) {
    this.chart1 = new Chart(ctx, chartConfig);
  }
}

//======Multiple Files 1======

private chart2: Chart | null = null;
private dataSubscription2: Subscription | null = null;
public chartData2: number[] = [];
public chartData22: number[] = [];
public labels2: string[] = [];
public uuids2: string[] = [];

randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

convertArray(owningFields: any) {
  let owningCommCollMap = {};
  let owningComm = [];
  let owningColl = [];

  if(owningFields.owningComm) {
    owningComm = owningFields.owningComm;
  }
  if(owningFields.owningColl) {
    owningColl = owningFields.owningColl;
  }

  for (let i = 0; i < owningComm.length; i += 2) {
    const id = owningComm[i];
    const value = owningComm[i + 1];
    owningCommCollMap[id] = value;
  }

  for (let j = 0; j < owningColl.length; j += 2) {
    const id = owningColl[j];
    const value = owningColl[j + 1];
    owningCommCollMap[id] = value;
  }

  return owningCommCollMap;
}

convertArray1(owningCommArray: any) {
  const owningCommMap = {};
  for (let i = 0; i < owningCommArray.length; i += 2) {
    const id = owningCommArray[i];
    const value = owningCommArray[i + 1];
    owningCommMap[id] = value;
  }
  return owningCommMap;
}

getValueById(uuid: string, owningCommMap: { [key: string]: number }): number | undefined {
  if(Number.isNaN(owningCommMap[uuid]) || typeof(owningCommMap[uuid])==='undefined') {
    return 0;
  }
  return owningCommMap[uuid];
}

removeDuplicates(arr: any[]): any[] {
  return [...new Set(arr)];
}

private async getRelationMap(): Promise<void> {
  const dataFile = 'assets/data/all-relations.json';

  return new Promise((resolve) => {
    this.dataSubscriptionRelationMap = this.http.get<any>(dataFile)
      .subscribe(response => {
        if (response.response.docs) {
          const relations = response.response.docs;
          for (let i = 0; i < relations.length; i++) {
            const parent = relations[i]['location.parent'];
            const resourceid = relations[i]['search.resourceid'];
            if (parent) {
              if (!this.relationMap[parent]) {
                this.relationMap[parent] = [];
              }
              this.relationMap[parent].push(resourceid);
            } else {
              this.relationMap[resourceid] = [];
            }
          }
        }
        resolve();
      });
  });
}

getImmediateChildren(scope: any): string[] | null {
  if (Object.keys(this.relationMap).length > 0 && this.relationMap[scope.id]) {
    return this.relationMap[scope.id];
  }
  return null;
}

private async loadDataFromFilesSite(): Promise<void> {
  // Define paths to each data file
  const dataFiles = [
    'assets/data/top-communities.json',
    'assets/data/all-comm-coll-pageviews.json',
    'assets/data/all-comm-coll-downloads.json'
  ];

  return new Promise((resolve) => {
    this.dataSubscription2 = forkJoin(
      dataFiles.map(file => this.http.get<any>(file))
    ).subscribe(responses => {
      responses.forEach((response, index) => {
        switch (index) {
          case 0: // top-communities.json
            // Extract dc.title value from top-communities.json's "response" object
            if (response.response && response.response.docs) {
              response.response.docs.forEach((doc: any) => {
                if (doc['dc.title'] && doc['dc.title'][0]) {
                  this.labels2.push(doc['dc.title'][0]);
                }
                if(doc['search.resourceid']) {
                  this.uuids2.push(doc['search.resourceid'])
                }
              });
            }
            break;

          case 1: // all-comm-coll-pageviews.json
            if (response.facet_counts && response.facet_counts.facet_fields) {
              const owningFields = response.facet_counts.facet_fields;
              const viewMap = this.convertArray(owningFields);
              this.uuids2.forEach((uuid) => {
                if(this.exceptionMap[uuid]) {
                  const children = this.removeDuplicates(this.relationMap[uuid]);
                  let sum = 0;
                  children.forEach((child) => {
                    sum += this.getValueById(child, viewMap);
                  })
                  this.chartData2.push(sum);
                } else {
                  this.chartData2.push(this.getValueById(uuid, viewMap));
                }
              });
            }
            break;

          case 2: // all-comm-coll-downloads.json
            if (response.facet_counts && response.facet_counts.facet_fields) {
              const owningFields = response.facet_counts.facet_fields;
              const viewMap = this.convertArray(owningFields);
              this.uuids2.forEach((uuid) => {
                if(this.exceptionMap[uuid]) {
                  const children = this.removeDuplicates(this.relationMap[uuid]);
                  let sum = 0;
                  children.forEach((child) => {
                    sum += this.getValueById(child, viewMap);
                  })
                  this.chartData22.push(sum);
                } else {
                  this.chartData22.push(this.getValueById(uuid, viewMap));
                }
              });
            }
            break;

          default:
            console.warn('Unexpected file structure');
        }
      });
      resolve(); // Resolve once all data is processed
    });
  });
}

private async loadDataFromFiles(scope: any): Promise<void> {
  // Define paths to each data file
  const dataFiles = [
    'assets/data/all-relations.json',
    'assets/data/all-communities-pageviews.json',
    'assets/data/all-communities-downloads.json'
  ];


  return new Promise((resolve) => {
    let immediateChilren: string[] = [];
    // this.relationMapService.getRelationMap().subscribe(
    //   relationMap => {
    //     this.relationMap = relationMap;
    //     immediateChilren = this.getImmediateChildren(scope);
    //     immediateChilren.forEach((uuid) => {
    //       console.log(uuid);
    //       this.getLabel(uuid).subscribe(result => {
    //         this.labels2.push(result);
    //       })
    //     })
    //   }
    // );
    this.dataSubscription2 = forkJoin(
      dataFiles.map(file => this.http.get<any>(file))
    ).subscribe(responses => {
      responses.forEach((response, index) => {
        switch (index) {
          case 0: // all-relations.json
            if (response.response.docs) {
              const relations = response.response.docs;
              for (let i = 0; i < relations.length; i++) {
                const parent = relations[i]['location.parent'];
                const resourceid = relations[i]['search.resourceid'];
                if (parent) {
                  if (!this.relationMap[parent]) {
                    this.relationMap[parent] = [];
                  }
                  this.relationMap[parent].push(resourceid);
                } else {
                  this.relationMap[resourceid] = [];
                }
              }
              immediateChilren = this.relationMap[scope.id];
            }

            immediateChilren.forEach((child) => {
              const label = this.getLabel(child).subscribe(result => {
                this.labels2.push(result);
              })
            })

            break;

          case 1: // all-communities-pageviews.json
            if (response.facet_counts && response.facet_counts.facet_fields && response.facet_counts.facet_fields.owningComm) {
                const owningCommArray = response.facet_counts.facet_fields.owningComm;
                const viewMap = this.convertArray1(owningCommArray);
                immediateChilren.forEach((child) => {
                  this.chartData2.push(this.getValueById(child, viewMap));
                })
              }
              break;

          case 2: // all-communities-downloads.json
            if (response.facet_counts && response.facet_counts.facet_fields && response.facet_counts.facet_fields.owningComm) {
              const owningCommArray = response.facet_counts.facet_fields.owningComm;
              const viewMap = this.convertArray1(owningCommArray);
              immediateChilren.forEach((child) => {
              })
            }
            break;

          default:
            console.warn('Unexpected file structure');
        }
      });
      resolve();
    });
  });
}

private initializeChart2(): void {
  const chartConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: this.labels2,
      datasets: [{
        label: 'pageviews',
        data: this.chartData2,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        stack: 'Stack 0'
      },
      {
        label: 'downloads',
        data: this.chartData22,
        backgroundColor: 'rgba(75,192,192,0.6)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        stack: 'Stack 1'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Pageviews and Downloads of Top Communities'
        },
        legend: {
          display: true,
          position: 'right'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };


  // Initialize the chart on the canvas element
  const ctx2 = document.getElementById('myChart2') as HTMLCanvasElement;
  if (ctx2) {
    this.chart2 = new Chart(ctx2, chartConfig);
  }
}

//======Multiple Files 2======

private chart3: Chart | null = null;
private dataSubscription3: Subscription | null = null;
public chartData3: number[] = [];
public labels3: string[] = [];

private async loadDataForDoughnut(scope: any): Promise<void> {
  let dataFiles = [];
  if (scope.type==='site') {
    dataFiles = [
      'assets/data/site-pageviews.json',
      'assets/data/site-downloads.json',
    ];
    } else if (scope.type==='community' || scope.type==='collection') {
    dataFiles = [
      'assets/data/all-comm-coll-pageviews.json',
      'assets/data/all-comm-coll-downloads.json'
    ];
  }

  return new Promise((resolve) => {
    this.dataSubscription3 = forkJoin(
      dataFiles.map(file => this.http.get<any>(file))
    ).subscribe(responses => {
      responses.forEach((response, index) => {
        switch (index) {
          case 0: // pageviews
            if (scope.type==='site') {
              if (response.response && response.response.numFound) {
                this.chartData3.push(response.response.numFound);
              }
            } else if (scope.type==='community' || scope.type==='collection') {
              if (response.facet_counts && response.facet_counts.facet_fields) {
                const owningFields = response.facet_counts.facet_fields;
                const viewMap = this.convertArray(owningFields);
                let pageviews: number = this.getValueById(scope.id, viewMap);
                if(typeof pageviews==='undefined' || pageviews===null) {
                  pageviews = 0;
                }
                if(this.offsets.exceptionComCols.includes(scope.id)) {
                  pageviews = pageviews + this.offsets.viewdownloads[scope.id][0];
                }
                this.chartData3.push(pageviews);
              }
            }
            break;

          case 1: // downloads
            if (scope.type==='site') {
              if (response.response && response.response.numFound) {
                this.chartData3.push(response.response.numFound);
              }
            } else if (scope.type==='community' || scope.type==='collection') {
              if (response.facet_counts && response.facet_counts.facet_fields) {
                const owningFields = response.facet_counts.facet_fields;
                const viewMap = this.convertArray(owningFields);
                let downloads: number = this.getValueById(scope.id, viewMap);
                if(typeof downloads==='undefined' || downloads===null) {
                  downloads = 0;
                }
                if(this.offsets.exceptionComCols.includes(scope.id)) {
                  downloads = downloads + this.offsets.viewdownloads[scope.id][1];
                }
                this.chartData3.push(downloads);
              }
            }

          default:
            console.warn('Unexpected file structure');
        }
      });
      resolve();
    });
  });

}

private initializeChartDoughnut(): void {
  const chartConfig: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: ['Pageviews '+this.formatNumber(this.chartData3[0]), 'Downloads '+this.formatNumber(this.chartData3[1])],
      datasets: [{
        label: 'Aggregated Dataset',
        data: this.chartData3,
        backgroundColor: [
          'rgba(13, 150, 142, 0.2)',  // color for pageviews
          'rgba(255, 99, 132, 0.2)'   // color for downloads
        ],
        borderColor: [
          'rgba(13, 150, 142, 1)',    // border color for pageviews
          'rgba(255, 99, 132, 1)'     // border color for downloads
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        title: {
          display: true,
          text: 'Total pageviews and downloads'
        }
      }
    }
  };

  // Initialize the chart on the canvas element
  const ctx3 = document.getElementById('chartDoughnut') as HTMLCanvasElement;
  if (ctx3) {
    this.chart3 = new Chart(ctx3, chartConfig);
  }
}

// Doughnut on Item page

private loadReportsData() {
  this.reports.forEach((report) => {
    switch (report.reportType) {
      case 'TotalVisits':
        this.hasData = report.points.length > 0;
        if (this.hasData) {
          this.chartData3.push(report.points[0].values['views']);
        }
        break;

      case 'TotalDownloads':
        this.hasData = report.points.length > 0;
        if (this.hasData) {
          let sumofdownloads: number = 0;
          report.points.forEach((point) => {
            sumofdownloads += point.values['views'];
          })
          this.chartData3.push(sumofdownloads);
        }
        break;

      case 'TotalVisitsPerMonth':
        this.hasData = report.points.length > 0;
        if (this.hasData) {
          report.points.forEach((point) => {
            this.labels1.push(point.label);
            this.chartData6monPageviews1.push(point.values['views']);
          })
        }
        break;

      case 'TopCountries':
        this.hasData = report.points.length > 0;
        if (this.hasData) {
          report.points.forEach((point) => {
            this.countryData[point.id] = point.values['views'];
          })
        }
        
        break;

      case 'TopCities':
        this.chartType1 = 'pie';
        break;
      default:
        this.chartType1 = 'line';
    }
  })
}

private itemCountSubscription: Subscription | null = null;
public allItemCount = 0;

private loadAllItemCount(): void {
  const dataFile = '/assets/data/all-item-count.json';
  this.http.get<any>(dataFile).subscribe(response => {
    this.allItemCount = response.response.numFound;
    this.loading = false;
    this.cdr.detectChanges();
  });
}

//====== Tables ======

public authorpageviews: TableViewData[] = [];
public authordownloads: TableViewData[] = [];
public itempageviews: TableViewData[] = [];
public itemdownloads: TableViewData[] = [];
private dataSubscriptionTb1: Subscription | null = null;
public loading = true;

private loadDataTb1(scope: any): void {
  let dataFiles = [];
  if(scope.type==='site') {
    dataFiles = [
      'assets/data/site-top10-item-pageviews.json',
      'assets/data/site-top10-item-downloads.json'
    ];
  } else if (scope.type==='community' || scope.type==='collection') {
    dataFiles = [
      `assets/data/${scope.id}/top10-item-pageviews.json`,
      `assets/data/${scope.id}/top10-item-downloads.json`
    ];
  }

  let itemviews1: TableViewData[] = [];
  let itemviews2: TableViewData[] = [];
  let sortedItems: TableViewData[] = [];
  let itemdownloads1: TableViewData[] = [];
  let itemdownloads2: TableViewData[] = [];
  let sortedDownloads: TableViewData[] = [];

  this.dataSubscriptionTb1 = forkJoin(
    dataFiles.map(file => this.http.get<any>(file))
  ).subscribe(responses => {
    responses.forEach((response, index) => {
      switch (index) {
        case 0: // site-top10-item-pageviews.json
          if (response.facet_counts && response.facet_counts.facet_fields && response.facet_counts.facet_fields.id) {
            itemviews1 = this.transformArray(response.facet_counts.facet_fields.id);
          }
          if(this.offsets.exceptionComCols.includes(scope.id)) {
            const pageviews = this.offsets.top10ItemViewDownloads[scope.id]["ItemId"];
            itemviews2 = this.transformArray(pageviews);
          }
          sortedItems = [...itemviews1, ...itemviews2]
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);
          this.itempageviews = sortedItems;
          this.loading = false;
          this.cdr.detectChanges();

          break;

        case 1: // site-top10-item-downloads.json
          if (response.facet_counts && response.facet_counts.facet_fields && response.facet_counts.facet_fields.owningItem) {
            itemdownloads1 = this.transformArray(response.facet_counts.facet_fields.owningItem);
          }
          if(this.offsets.exceptionComCols.includes(scope.id)) {
            const downloads = this.offsets.top10ItemViewDownloads[scope.id]["owningItem"];
            itemdownloads2 = this.transformArray(downloads);
          }
          sortedDownloads = [...itemdownloads1, ...itemdownloads2]
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);
          this.itemdownloads = sortedDownloads;
          this.loading = false;
          this.cdr.detectChanges();

          break;

        default:
          console.warn('Unexpected file structure');
      }
    });
  });
}

private transformArray(data: (string | number)[]): TableViewData[] {
  const transformed: TableViewData[] = [];
  for (let i = 0; i < data.length; i += 2) {
    if (typeof data[i] === 'string' && typeof data[i + 1] === 'number') {
      transformed.push({ title: data[i] as string, views: data[i + 1] as number });
    }
  }
  return transformed;
}

getLabel(uuid: string): Observable<string> {
  return this.dsoService.findById(uuid).pipe(
    getFinishedRemoteData(),
    getRemoteDataPayload(),
    map((item) => !isEmpty(item) ? this.nameService.getName(item) : this.translateService.instant('statistics.chart.no-name')),
  );
}

getItem(uuid: string): Observable<DSpaceObject> {
  return this.itemService.findById(uuid).pipe(
    getFirstCompletedRemoteData(),
    map((rd: RemoteData<Item>) => {
      if (rd.hasSucceeded) {
        return rd.payload;
      }
      throw new Error(rd.errorMessage);
    })
  );
}

// getDsoObject(uuid: string): Observable<DSpaceObject> {
//   return this.dsoService.findById(uuid).pipe(
//     getFirstCompletedRemoteData(),
//     map((rd: RemoteData<DSpaceObject>) => {
//       if (rd.hasSucceeded) {
//         return rd.payload.;
//       }
//       throw new Error(rd.errorMessage);
//     })
//   );
// }

getItemAuthors(uuid: string) {
  // let authors: string[] = [];
  return this.getItem(uuid).subscribe((item) => {
    item.allMetadataValues(['dc.contributor.author', 'dc.creator', 'dc.contributor.*']);
  });
}

  getTopCommunities(data) {
    const topComms: any = data.response.docs;
    topComms.forEach((doc: any) => {
      this.topcommunitytitles.push(doc['dc.title'][0]);
      this.topcommunityids.push(doc['search.resourceid']);
    })
  }

  getNumberByUUID(uuid: string, structuredArray: any): number | undefined {
    const entry = structuredArray.find(item => item.uuid === uuid);
    return entry ? entry.number : undefined;
  }

  getTopCommunityViews() {
    this.topcommunityids.forEach((id) => {
      this.topcommunitypageviews.push(this.getNumberByUUID(id, this.allcommunitiespageviewsArray));
      this.topcommunitydownloads.push(this.getNumberByUUID(id, this.allcommunitiesdownloadsArray));
    })
  }

  getAllcommunitiespageviewsArray() {
    const commarray = this.allcommunitiespageviews.facet_counts.facet_fields.owningComm;
    for (let i = 0; i < commarray.length; i += 2) {
      this.allcommunitiespageviewsArray.push({
        uuid: commarray[i],
        views: commarray[i + 1]
      });
    }
  }

  getAllcommunitiesdownloadsArray() {
    const commarray = this.allcommunitiesdownloads.facet_counts.facet_fields.owningComm;
    for (let i = 0; i < commarray.length; i += 2) {
      this.allcommunitiesdownloadsArray.push({
        uuid: commarray[i],
        views: commarray[i + 1]
      });
    }      
  }

  private geoJsonData: any;

  // Charts
  @ViewChild('chartCanvas') chartCanvas: ElementRef;
  @ViewChild('barChartCanvas') barChartCanvas: ElementRef;
  @ViewChild('lineChartCanvas') lineChartCanvas: ElementRef;

  labels: string[] = [];
  viewCounts: number[] = [];
  public chartData11: ChartConfiguration['data'];
  public chartType1: ChartConfiguration['type'];
  public barChartData1: ChartConfiguration['data'];
  public lineChartData1: ChartConfiguration['data'];

  private initItemChart() {
    this.reports.forEach((report) => {
      switch (report.reportType) {
        case 'TotalVisits':
          this.chartType1 = 'doughnut';
          break;
        case 'TotalDownloads':
          this.chartType1 = 'doughnut';
          break;
        case 'TotalVisitsPerMonth':
          this.chartType1 = 'bar';
          break;
        case 'TopCountries':
          this.chartType1 = 'pie';
          break;
        case 'TopCities':
          this.chartType1 = 'pie';
          break;
        default:
          this.chartType1 = 'line';
      }  
    })
  }

  public truncateString(str, maxLength) {
    if (str!==null && str.length > maxLength) {
      return str.slice(0, maxLength) + "...";
    } else {
      return str;
    }
  }

  // public chartType: ChartConfiguration['type'] = 'doughnut'; //bar, line, scatter, pie, bubble, radar, polarArea

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Map
  private map: any;
  private dataSubscriptionMap1: Subscription | null = null;
  private dataSubscriptionMap2: Subscription | null = null;

  // Sample population data for countries
  public countryData = {};
  public countryCodeName = {};
  public countryData2 = {};

  private initMap(): void {
    this.map = L.map('map', {
      center: [42.8, -10.5],
      zoom: 2
    });

    // Add a tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Handle resize events
    window.addEventListener('resize', () => {
      this.map.invalidateSize();
    });
  }

  private createChoroplethLayer(geoJsonData: any): void {
    L.geoJSON(geoJsonData, {
      style: (feature) => this.style(feature),
      onEachFeature: (feature, layer) => this.onEachFeature(feature, layer)
    }).addTo(this.map);
  }

  private style(feature: any): any {
    const countryCode = feature.properties.ISO_A2;  // Match country code
    const viewCounts = this.countryData[countryCode];

    return {
      fillColor: this.getColor(viewCounts),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  }

  private highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
      weight: 3,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    layer.bringToFront();
  }

  private resetHighlight(e) {
    const layer = e.target;
    layer.resetStyle({
      weight: 3,
      color: '#fff',
      dashArray: '',
      fillOpacity: 0
    });
    layer.bringToFront();
  }

  private getColor(d: number): string {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' : '#FFEDA0';
  }

  // Bind popups for each feature
  private onEachFeature(feature: any, layer: any): void {
    const countryCode = feature.properties.ISO_A2;
    const viewCounts = this.countryData[countryCode];
    layer.bindPopup(`<strong>${feature.properties.ADMIN}</strong><br>Downloads: ${this.formatNumber(viewCounts)}`);
    if(viewCounts > 0) {
      this.countryData2[feature.properties.ADMIN] = viewCounts;
    }
    
    // layer.on({
    //   mouseover: this.highlightFeature,
    //   mouseout: this.resetHighlight,
    //   click: this.zoomToFeature
    // });

  }


  private zoomToFeature(e) {
    this.map.fitBounds(e.target.getBounds());
  }

  private async initSiteCountryDownloads(scope: any): Promise<void> {
    let dataFile = '';
    if(scope.type==='site') {
      dataFile = '/assets/data/site-country-downloads.json';
    } else if (scope.type==='community' || scope.type==='collection') {
      dataFile = `/assets/data/${scope.id}/country-downloads.json`;
    }

    return new Promise((resolve) => {
      this.dataSubscriptionMap1 = this.http.get<any>(dataFile)
        .subscribe(response => {
          if (response.facet_counts && response.facet_counts.facet_fields && response.facet_counts.facet_fields.countryCode) {
            const countryCode = response.facet_counts.facet_fields.countryCode;
            for (let i = 0; i < countryCode.length; i += 2) {
              this.countryData[countryCode[i]] = countryCode[i+1];
            }
          }

          if(this.offsets.exceptionComCols.includes(scope.id)) {
            const downloads = this.offsets.countryDownloads[scope.id];
            for (let i = 0; i < downloads.length; i += 2) {
              if(this.countryData[downloads[i]]) {
                this.countryData[downloads[i]] = this.countryData[downloads[i]] + downloads[i+1];
              } else {
                this.countryData[downloads[i]] = downloads[i+1];
              }
            }
          }
          resolve();
        });
    });
  }

  private async initCountryCodeNames(): Promise<void> {
    const dataFile = '/assets/js/countries.geojson';

    return new Promise((resolve) => {
      this.dataSubscriptionMap2 = this.http.get<any>(dataFile)
        .subscribe(response => {
          if (response.features) {
            const countries = response.features;
            countries.forEach((country) => {
              this.countryCodeName[country.properties.ISO_A2] = country.properties.ADMIN;
            })
          }
          resolve();
        });
    });
  }

  public formatNumber(value: number | string, separator: string = ','): string {
    if (typeof value === 'string' && value.length === 0) {
      return "";
    }
    if (typeof value === 'undefined') {
      return "0";
    }
    
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    
    // Split number into integer and decimal parts
    const [integerPart, decimalPart = ''] = absNum.toString().split('.');
    
    // Add thousands separator to integer part
    const formattedInteger = integerPart
        .split('')
        .reverse()
        .reduce((acc, digit, index) => {
            const shouldAddSeparator = index > 0 && index % 3 === 0;
            return digit + (shouldAddSeparator ? separator : '') + acc;
        }, '');
    
    // Combine parts
    const result = formattedInteger + (decimalPart ? `.${decimalPart}` : '');

    // Add negative sign if needed
    return isNegative ? `-${result}` : result;
  }

  get countryTableData() {
    const codenames = this.codenamepairs;
    const entries =  Object.entries(this.countryData);
    console.log("HERE IS THE LIST");
    console.log(entries);
    const len = entries.length;
    const rows = [];

    for (let i = 0; i < entries.length; i += 2) {
      if(i+1 < len) {
        let c1 = entries[i][0];
        let d1 = entries[i][1];
        let c2 = entries[i+1][0];
        let d2 = entries[i+1][1];
        if(typeof(codenames[c1]!=='undefined')) {
          c1 = codenames[c1];
        }
        if(typeof(codenames[c2]!=='undefined')) {
          c2 = codenames[c2];
        }
        rows.push({
          country1: c1,
          downloads1: d1,
          country2: c2,
          downloads2: d2
        });  
      } else {
        let c1 = entries[i][0];
        let d1 = entries[i][1];
        const c2 = '';
        const d2 = '';
        if(typeof(codenames[c1]!=='undefined')) {
          c1 = codenames[c1];
          rows.push({
            country1: c1,
            downloads1: d1,
            country2: c2,
            downloads2: d2
          });  
        }
      }
    }
    return rows;
  }

  sortObjectByValue(obj: { [key: string]: number }): { [key: string]: number } {
    const entries = Object.entries(obj);
    entries.sort((a, b) => b[1] - a[1]);
    
    const sortedObject: { [key: string]: number } = {};
    entries.forEach(([key, value]) => {
      sortedObject[key] = value;
    });
  
    return sortedObject;
  }

}
