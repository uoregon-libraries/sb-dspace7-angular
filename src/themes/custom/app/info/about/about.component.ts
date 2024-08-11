import { Component } from '@angular/core';
import { AboutComponent as BaseComponent } from '../../../../../app/info/about/about.component';

@Component({
  selector: 'ds-about',
  // styleUrls: ['./about.component.scss'],
  styleUrls: ['../../../../../app/info/about/about.component.scss'],
  // templateUrl: './about.component.html'
  templateUrl: '../../../../../app/info/about/about.component.html'
})

/**
 * Component displaying the Contact Us page
 */
export class AboutComponent extends BaseComponent {}

