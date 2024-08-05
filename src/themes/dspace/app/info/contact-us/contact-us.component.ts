import { Component } from '@angular/core';
import { ContactUsComponent as BaseComponent } from '../../../../../app/info/contact-us/contact-us.component';

@Component({
  selector: 'ds-contact-us',
  // styleUrls: ['./contact-us.component.scss'],
  styleUrls: ['../../../../../app/info/contact-us/contact-us.component.scss'],
  // templateUrl: './contact-us.component.html'
  templateUrl: '../../../../../app/info/contact-us/contact-us.component.html'
})

/**
 * Component displaying the Contact info
 */
export class ContactUsComponent extends BaseComponent {}
