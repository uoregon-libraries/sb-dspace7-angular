import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, Inject } from '@angular/core';

import { BehaviorSubject, combineLatest as observableCombineLatest, Subscription } from 'rxjs';

import { SortDirection, SortOptions } from '../../core/cache/models/sort-options.model';
import { CommunityDataService } from '../../core/data/community-data.service';
import { PaginatedList } from '../../core/data/paginated-list.model';
import { RemoteData } from '../../core/data/remote-data';
import { Community } from '../../core/shared/community.model';
import { fadeInOut } from '../../shared/animations/fade';
import { PaginationComponentOptions } from '../../shared/pagination/pagination-component-options.model';
import { hasValue } from '../../shared/empty.util';
import { switchMap } from 'rxjs/operators';
import { PaginationService } from '../../core/pagination/pagination.service';
import { AppConfig, APP_CONFIG } from 'src/config/app-config.interface';

/**
 * this component renders the Top-Level Community list
 */
@Component({
  selector: 'ds-top-level-community-group',
  styleUrls: ['./top-level-community-group.component.scss'],
  templateUrl: './top-level-community-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInOut]
})

export class TopLevelCommunityGroupComponent implements OnInit, OnDestroy {
  /**
   * A list of remote data objects of all top communities
   */
  communitiesRD$: BehaviorSubject<RemoteData<PaginatedList<Community>>> = new BehaviorSubject<RemoteData<PaginatedList<Community>>>({} as any);

  /**
   * The pagination configuration
   */
  config: PaginationComponentOptions;

  /**
   * The pagination id
   */
  pageId = 'tl';

  /**
   * The sorting configuration
   */
  sortConfig: SortOptions;

  /**
   * The subscription to the observable for the current page.
   */
  currentPageSubscription: Subscription;

  constructor(
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
    private cds: CommunityDataService,
    private paginationService: PaginationService
  ) {
    this.config = new PaginationComponentOptions();
    this.config.id = this.pageId;
    this.config.pageSize = appConfig.homePage.topLevelCommunityList.pageSize;
    this.config.currentPage = 1;
    this.sortConfig = new SortOptions('dc.title', SortDirection.ASC);
  }

  ngOnInit() {
    this.initPage();
  }


  /**
   * Update the list of top communities
   */
  initPage() {
    const pagination$ = this.paginationService.getCurrentPagination(this.config.id, this.config);
    const sort$ = this.paginationService.getCurrentSort(this.config.id, this.sortConfig);

    this.currentPageSubscription = observableCombineLatest([pagination$, sort$]).pipe(
      switchMap(([currentPagination, currentSort]) => {
        return this.cds.findTop({
          currentPage: currentPagination.currentPage,
          elementsPerPage: currentPagination.pageSize,
          sort: {field: currentSort.field, direction: currentSort.direction}
        });
      })
    ).subscribe((results) => {
      this.communitiesRD$.next(results);
    });
  }

  /**
   * Unsubscribe the top list subscription if it exists
   */
  private unsubscribe() {
    if (hasValue(this.currentPageSubscription)) {
      this.currentPageSubscription.unsubscribe();
    }
  }

  /**
   * Clean up subscriptions when the component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe();
    this.paginationService.clearPagination(this.config.id);
  }

  items = [
    { icon: 'Grad-Cap-01-UO-Green.png', label: 'Theses & Dissertations', uuid: 'c31cddcc-2224-49cf-bb6e-3cfc0e812ff4' },
    { icon: 'Briefcase-01-UO-Green.png', label: 'University Scholarship', uuid: 'e781c503-6d9f-49b0-923b-2a96a35c90e2' },
    { icon: 'Globe-01-UO-Green.png', label: 'Open Publications', uuid: '400686ec-3d2e-4824-8d38-1627f44df743' },
    { icon: 'Newspaper-02-UO-Green.png', label: 'University Archives', uuid: '400686ec-3d2e-4824-8d38-1627f44df743' }
  ];

  items1 = [
    { icon: 'fas fa-graduation-cap', label: 'Theses & Dissertations', uuid: 'c31cddcc-2224-49cf-bb6e-3cfc0e812ff4' },
    { icon: 'fas fa-briefcase', label: 'University Scholarship', uuid: 'e781c503-6d9f-49b0-923b-2a96a35c90e2' },
    { icon: 'fas fa-globe', label: 'Open Publications', uuid: '400686ec-3d2e-4824-8d38-1627f44df743' },
    { icon: 'fas fa-archive', label: 'University Archives', uuid: '400686ec-3d2e-4824-8d38-1627f44df743' }
  ];

}
