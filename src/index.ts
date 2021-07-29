import {
  getHubApiUrl,
  getPortalApiUrl,
  getSiteById,
  IDomainEntry,
  IHubRequestOptions,
  lookupDomain,
} from '@esri/hub-common';
import { IContentSearchRequest } from '@esri/hub-search';
import { Request, Response } from 'express';
import * as _ from 'lodash';
import { version } from '../package.json';
import { getDataStreamDcatAp201 } from './dcat-ap';
import * as config from 'config';

export = class Output {
  static type = 'output';
  static version = version;
  static routes = [
    {
      path: '/dcat-ap/2.0.1',
      methods: ['get'],
      handler: 'serve',
    },
  ];

  model: any;

  public async serve (req: Request, res: Response) {
    res.set('Content-Type', 'application/json');

    const portalUrl = config.has('arcgisPortal')
      ? config.get('arcgisPortal') as string
      : 'https://www.arcgis.com';

    const requestOptions: IHubRequestOptions = {
      isPortal: false,
      hubApiUrl: getHubApiUrl(portalUrl),
      portal: getPortalApiUrl(portalUrl),
      authentication: null,
    };

    try {
      const domainRecord = (await lookupDomain(
        req.hostname,
        requestOptions,
      )) as IDomainEntry;
      const siteModel = await getSiteById(domainRecord.siteId, requestOptions);

      if (!_.has(siteModel, 'data.catalog')) {
        res.status(200).send({});
        return;
      }

      const dcatStream = getDataStreamDcatAp201({
        domainRecord,
        siteItem: siteModel.item,
        env: this.getEnvFromPortal(portalUrl),
      });

      const searchRequest: IContentSearchRequest = {
        filter: {
          group: _.get(siteModel, 'data.catalog.groups'),
          orgid: _.get(siteModel, 'data.catalog.orgId'),
        },
        options: {
          portal: portalUrl
        }
      };

      req.res.locals.searchRequest = searchRequest;

      const datasetStream = await this.model.pullStream(req);

      datasetStream
        .pipe(dcatStream)
        .pipe(res)
        .on('error', (err) => {
          res.status(500).send(this.getErrorResponse(err));
        });
    } catch (err) {
      res.status(500).send(this.getErrorResponse(err));
    }
  }

  private getErrorResponse (err: any) {
    return { error: _.get(err, 'message', 'Encountered error while processing request') };
  }

  private getEnvFromPortal (portalUrl: string) {
    let env;
    if (/devext\.|mapsdev\./.test(portalUrl)) {
      env = 'dev';
    } else if (/qaext\.|mapsqa\./.test(portalUrl)) {
      env = 'qa';
    } else {
      env = 'prod';
    }
    return env;
  }
};
