import { Component } from '@angular/core';
import {
  ContactusFormComponent as BaseComponent
} from '../../../../../../app/info/contactus/contactus-form/contactus-form.component';

@Component({
  selector: 'ds-contactus-form',
  templateUrl: './contactus-form.component.html',
  // templateUrl: '../../../../../../app/info/contactus/contactus-form/contactus-form.component.html',
  styleUrls: ['./contactus-form.component.scss'],
  // styleUrls: ['../../../../../../app/info/contactus/contactus-form/contactus-form.component.scss'],
})
export class ContactusFormComponent extends BaseComponent {
}
