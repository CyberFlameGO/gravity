/**
 * Copyright 2021 Gravitational Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import cfg from 'oss-app/config';
import reactor from 'oss-app/reactor';
import OverlayHost from 'oss-app/components/common/overlayHost';
import { Failed } from 'oss-app/components/msgPage';
import Indicator from 'oss-app/components/common/indicator';
import connect from 'oss-app/lib/connect';
import sitesGetters from 'oss-app/flux/sites/getters';

import getters from './../flux/getters';
import NavTopBar from './navTopBar';
import DeleteAppDialog from './dialogs/deleteAppDialog';
import UninstallSiteDialog from './dialogs/uninstallSiteDialog';
import UnlinkSiteDialog from './dialogs/unlinkSiteDialog';

const Portal = props => {
  const { attempt, children } = props;
  const { isFailed, isProcessing, message } = attempt;

  if(isFailed){
    return <Failed message={message} />;
  }

  if(isProcessing){
    return <div><Indicator enabled={true} type={'bounce'}/></div>;
  }

  let siteId = cfg.getLocalSiteId();
  let logoUri = reactor.evaluate(sitesGetters.siteLogo(siteId));

  return (
    <OverlayHost>
      <div className="grv-portal">
        <NavTopBar logoUri={logoUri}/>
        {children}
        <DeleteAppDialog/>
        <UninstallSiteDialog/>
        <UnlinkSiteDialog/>
      </div>
    </OverlayHost>
  );
}

const mapFluxToState = () => ({
  attempt: getters.initPortalAttemp
})

export default connect(mapFluxToState)(Portal);
