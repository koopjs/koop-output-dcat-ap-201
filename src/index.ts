import { Request, Response } from 'express';
import * as config from 'config';
import * as _ from 'lodash';

import {
  getHubApiUrl,
  getPortalApiUrl,
  getSiteById,
  IDomainEntry,
  IHubRequestOptions,
  lookupDomain,
} from '@esri/hub-common';
import { IContentSearchRequest } from '@esri/hub-search';

import { version } from '../package.json';
import { getDataStreamDcatAp201 } from './dcat-ap';

const portalUrl = config.has('arcgisPortal')
  ? (config.get('arcgisPortal') as string)
  : 'https://www.arcgis.com';

let env: 'prod' | 'qa' | 'dev' = 'prod';
if (/devext\.|mapsdev\./.test(portalUrl)) {
  env = 'dev';
} else if (/qaext\.|mapsqa\./.test(portalUrl)) {
  env = 'qa';
}

function getApiTermsFromDependencies (dependencies: string[]) {
  // Hub API only supports scoping by top-level terms
  return Array.from(new Set(dependencies.map(dep => dep.split('.')[0])));
}

export = class OutputDcatAp201 {
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

  public async serve(req: Request, res: Response) {
    res.set('Content-Type', 'application/json');

    try {
      const { domainRecord, siteModel } = await this.fetchDomainAndSite(req.hostname);

      const siteCatalog = _.get(siteModel, 'data.catalog');
      if (!siteCatalog) {
        res.status(200).send({});
        return;
      }
      const orgBaseUrl = `https://${domainRecord.orgKey}.maps${
        env === 'prod' ? '' : env
      }.arcgis.com`;

      const customFormatTemplate = _.get(siteModel, 'data.feeds.dcatAP201');
      
      const { dcatStream, dependencies } = getDataStreamDcatAp201({
        domainRecord,
        siteItem: siteModel.item,
        orgBaseUrl,
        customFormatTemplate
      });
      
      const apiTerms = getApiTermsFromDependencies(dependencies);
      
      req.res.locals.searchRequest = this.getSearchRequest(
        siteCatalog,
        portalUrl,
        apiTerms
      );

      const datasetStream = await this.model.pullStream(req);

      datasetStream
        .pipe(dcatStream)
        .pipe(res)
        .on('error', (err: any) => {
          res.status(500).send(this.getErrorResponse(err));
        });
    } catch (err) {
      res.status(500).send(this.getErrorResponse(err));
    }
  }

  private async fetchDomainAndSite(hostname) {
    const requestOptions = this.getRequestOptions(portalUrl);

    const domainRecord = (await lookupDomain(
      hostname,
      requestOptions,
    )) as IDomainEntry;
    const siteModel = await getSiteById(domainRecord.siteId, requestOptions);

    return { domainRecord, siteModel };
  }

  private getRequestOptions(portalUrl: string): IHubRequestOptions {
    return {
      isPortal: false,
      hubApiUrl: getHubApiUrl(portalUrl),
      portal: getPortalApiUrl(portalUrl),
      authentication: null,
    };
  }

  private getSearchRequest(
    catalog: any,
    portalUrl: string,
    fields: string[]
  ): IContentSearchRequest {
    const searchRequest: IContentSearchRequest = {
      filter: {
        group: catalog.groups,
        orgid: catalog.orgId,
      },
      options: {
        portal: portalUrl,
        fields: fields.join(',')
      },
    };
    return searchRequest;
  }

  private getErrorResponse(err: any) {
    return {
      error: _.get(
        err,
        'message',
        'Encountered error while processing request',
      ),
    };
  }
};
