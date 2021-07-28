import { getHubApiUrl, getSiteById, IDomainEntry, IHubRequestOptions, lookupDomain } from '@esri/hub-common';
import { IContentSearchRequest } from '@esri/hub-search';
import { Request, Response } from 'express';
import _ from 'lodash';
import { version } from '../package.json';
import { getDataStreamDcatAp201 } from './dcat-ap';

export = class Output {
    static type = 'output';
    static version = version;
    static routes = [
      {
        path: '/dcat-ap/2.0.1',
        methods: ['get'],
        handler: 'serve'
      }
    ];

    model: any;

    async serve (req: Request, res: Response) {
      const portalUrl = 'https://www.arcgis.com';

      const requestOptions: IHubRequestOptions = {
        isPortal: false,
        hubApiUrl: getHubApiUrl(portalUrl),
        portal: portalUrl,
        authentication: null
      };

      const domainRecord = await lookupDomain(req.hostname, requestOptions) as IDomainEntry;
      const siteModel = await getSiteById(domainRecord.siteId, requestOptions);

      const dcatStream = getDataStreamDcatAp201({
        domainRecord,
        siteItem: siteModel.item,
        env: 'prod'
      });

      const searchRequest: IContentSearchRequest = {
        filter: {
          group: _.get(siteModel, 'data.catalog.groups'),
          orgid: _.get(siteModel, 'data.catalog.orgId')
        }
      };

      req.res.locals.searchRequest = searchRequest;

      const datasetStream = this.model.pullStream(req);

      datasetStream.pipe(dcatStream).pipe(res);
    }
}