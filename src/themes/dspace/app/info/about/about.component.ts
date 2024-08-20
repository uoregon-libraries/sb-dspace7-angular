import { Component } from '@angular/core';
import { AboutComponent as BaseComponent } from '../../../../../app/info/about/about.component';

@Component({
  selector: 'ds-about',
  styleUrls: ['./about.component.scss'],
  // styleUrls: ['../../../../../app/info/about/about.component.scss'],
  templateUrl: './about.component.html'
  // templateUrl: '../../../../../app/info/about/about.component.html'
})

/**
 * Component displaying the About info
 */
export class AboutComponent extends BaseComponent {
  title = "Scholars' Bank Overview";

  characteristics = [
    "Authors select scholarly works to deposit in the archive and are responsible for insuring that deposits do not violate copyright laws.",
    "Authors retain copyright over deposited materials (unless they sign it away to a third party)",
    "We recommend that files for submission be converted to a non-proprietary format if at all possible. For more guidance please see this resource for detailed file format standards. For files exceeding 50 MB, please contact the Scholars' Bank Manager for planning.",
    "Materials are searchable through search engines such as Google, and international search engines and harvesters such as OAIster",
    "Accepted materials will be preserved and migrated to newer formats to the extent that we are able to recognize and support submitted file formats.",
    "No materials will be removed without the authors' knowledge"
  ];
}
