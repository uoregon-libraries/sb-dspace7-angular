import { autoserialize, inheritSerialization } from 'cerialize';
import { typedObject } from '../../cache/builders/build-decorators';

import { DSpaceObject } from '../../shared/dspace-object.model';
import { HALLink } from '../../shared/hal-link.model';
import { CONTACTUS } from './contactus.resource-type';

@typedObject
@inheritSerialization(DSpaceObject)
export class Contactus extends DSpaceObject {
  static type = CONTACTUS;

  /**
   * The email address
   */
  @autoserialize
  public email: string;

  /**
   * The name
   */
  @autoserialize
  public senderName: string;

  /**
   * A string representing message the user inserted
   */
  @autoserialize
  public relationship: string;

  @autoserialize
  public related: string;

  @autoserialize
  public message: string;

  /**
   * A string representing the page from which the user came from
   */
  @autoserialize
  public page: string;

  _links: {
    self: HALLink;
  };

}
