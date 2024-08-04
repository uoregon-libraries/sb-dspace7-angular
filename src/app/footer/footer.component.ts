import { Component, Optional } from '@angular/core';
import { hasValue } from '../shared/empty.util';
import { KlaroService } from '../shared/cookies/klaro.service';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { AuthorizationDataService } from '../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../core/data/feature-authorization/feature-id';

@Component({
  selector: 'ds-footer',
  styleUrls: ['footer.component.scss'],
  templateUrl: 'footer.component.html'
})
export class FooterComponent {
  dateObj: number = Date.now();

  /**
   * A boolean representing if to show or not the top footer container
   */
  showTopFooter = true;
  showPrivacyPolicy = environment.info.enablePrivacyStatement;
  showEndUserAgreement = environment.info.enableEndUserAgreement;
  showSendFeedback$: Observable<boolean>;

  constructor(
    @Optional() private cookies: KlaroService,
    private authorizationService: AuthorizationDataService,
  ) {
    this.showSendFeedback$ = this.authorizationService.isAuthorized(FeatureID.CanSendFeedback);
  }

  showCookieSettings() {
    if (hasValue(this.cookies)) {
      this.cookies.showSettings();
    }
    return false;
  }


  socialMedia = [
    { 
      name: 'Facebook',
      icon: 'fab fa-facebook-f',
      link: 'https://www.facebook.com/uolibraries'
    },
    {
      name: 'YouTube',
      icon: 'fab fa-youtube',
      link: 'https://www.youtube.com/c/uolibrarieseugene'
    },
    {
      name: 'Instagram',
      icon: 'fab fa-instagram',
      link: 'https://www.instagram.com/uolibraries/'
    },
    {
      name: 'LinkedIn',
      icon: 'fab fa-linkedin-in',
      link: 'https://www.linkedin.com/'
    }
  ];
}
