import { RemoteData } from '../../../core/data/remote-data';
import { NoContent } from '../../../core/shared/NoContent.model';
import { ContactusDataService } from '../../../core/contactus/contactus-data.service';
import { Component, Inject, OnInit } from '@angular/core';
import { RouteService } from '../../../core/services/route.service';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { EPerson } from '../../../core/eperson/models/eperson.model';
import { getFirstCompletedRemoteData } from '../../../core/shared/operators';
import { Router } from '@angular/router';
import { getHomePageRoute } from '../../../app-routing-paths';
import { take } from 'rxjs/operators';
import { NativeWindowRef, NativeWindowService } from '../../../core/services/window.service';
import { URLCombiner } from '../../../core/url-combiner/url-combiner';

@Component({
  selector: 'ds-contactus-form',
  templateUrl: './contactus-form.component.html',
  styleUrls: ['./contactus-form.component.scss']
})
/**
 * Component displaying the contents of the contact us Statement
 */
export class ContactusFormComponent implements OnInit {

  /**
   * Form builder created used from the contactus from
   */
  contactusForm = this.fb.group({
    email: ['', [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
    senderName: ['', Validators.required],
    message: ['', Validators.required],
    relationship: ['', Validators.required],
    related: ['', Validators.required],
    page: [''],
  });

  constructor(
    @Inject(NativeWindowService) protected _window: NativeWindowRef,
    public routeService: RouteService,
    private fb: UntypedFormBuilder,
    protected notificationsService: NotificationsService,
    protected translate: TranslateService,
    private contactusDataService: ContactusDataService,
    private authService: AuthService,
    private router: Router) {
  }

  /**
   * On init check if user is logged in and use its email if so
   */
  ngOnInit() {

    this.authService.getAuthenticatedUserFromStore().pipe(take(1)).subscribe((user: EPerson) => {
      if (!!user) {
        this.contactusForm.patchValue({ email: user.email });
      }
    });

    this.routeService.getPreviousUrl().pipe(take(1)).subscribe((url: string) => {
      if (!url) {
        url = getHomePageRoute();
      }
      const relatedUrl = new URLCombiner(this._window.nativeWindow.origin, url).toString();
      this.contactusForm.patchValue({ page: relatedUrl });
    });

  }

  /**
   * Function to create the contactus from form values
   */
  createContactus(): void {
    const url = this.contactusForm.value.page.replace(this._window.nativeWindow.origin, '');
    this.contactusDataService.create(this.contactusForm.value).pipe(getFirstCompletedRemoteData()).subscribe((response: RemoteData<NoContent>) => {
      if (response.isSuccess) {
        this.notificationsService.success(this.translate.instant('info.contactus.create.success'));
        this.contactusForm.reset();
        this.router.navigateByUrl(url);
      }
    });
  }

  relationships = [
    'Student',
    'Faculty/Clinical',
    'Staff Member',
    'Community Member',
    'Other'
  ];
  repositoryOptions = ['Yes', 'No', 'Unsure'];

}
