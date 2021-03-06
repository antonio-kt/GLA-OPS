/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */

import NumberUtil from './NumberUtil';
import StringUtil from './StringUtil';
import DateUtil from './DateUtil';

class Util {
  constructor(){
    this.Number = NumberUtil;
    this.String = StringUtil;
    this.Date = DateUtil;
  }
}


angular.module('GLA')
  .service('Util', Util);
