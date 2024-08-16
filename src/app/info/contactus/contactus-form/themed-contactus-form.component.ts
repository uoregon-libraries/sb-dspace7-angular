import { Component } from '@angular/core';
import { ThemedComponent } from '../../../shared/theme-support/themed.component';
import { ContactusFormComponent } from './contactus-form.component';

/**
 * Themed wrapper for {@link ContactusFormComponent}
 */
@Component({
  selector: 'ds-themed-contactus-form',
  styleUrls: [],
  templateUrl: '../../../shared/theme-support/themed.component.html',
})
export class ThemedContactusFormComponent extends ThemedComponent<ContactusFormComponent> {

  protected getComponentName(): string {
    return 'ContactusFormComponent';
  }

  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`../../../../themes/${themeName}/app/info/contactus/contactus-form/contactus-form.component`);
  }

  protected importUnthemedComponent(): Promise<any> {
    return import('./contactus-form.component');
  }

}
