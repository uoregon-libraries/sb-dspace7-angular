import { Component } from '@angular/core';
import { NavbarComponent as BaseComponent } from '../../../../app/navbar/navbar.component';
import { slideMobileNav } from '../../../../app/shared/animations/slide';

/**
 * Component representing the public navbar
 */
@Component({
  selector: 'ds-navbar',
  styleUrls: ['./navbar.component.scss'],
  templateUrl: './navbar.component.html',
  animations: [slideMobileNav]
})
export class NavbarComponent extends BaseComponent {

  navItems = [
    { path: 'info/about', label: 'About' },
    // { path: './communities/33b6d1c5-dc92-4759-b82a-01dc75b1be67', label: 'Author Profiles' },
    { path: 'info/contactus', label: 'Contact Us' }
  ];

}
