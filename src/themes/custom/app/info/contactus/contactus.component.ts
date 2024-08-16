import { Component } from '@angular/core';
import { ContactusComponent as BaseComponent } from '../../../../../app/info/contactus/contactus.component';

@Component({
  selector: 'ds-contactus',
  // styleUrls: ['./contactus.component.scss'],
  styleUrls: ['../../../../../app/info/contactus/contactus.component.scss'],
  // templateUrl: './contactus.component.html'
  templateUrl: '../../../../../app/info/contactus/contactus.component.html'
})

/**
 * Component displaying the Contact Us page
 */
export class ContactusComponent extends BaseComponent {}

