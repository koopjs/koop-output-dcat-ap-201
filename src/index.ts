import { Request, Response } from 'express';
import * as _ from 'lodash';

import {
  getHubApiUrl,
  getPortalApiUrl,
  getSiteById,
  hubApiRequest,
  IDomainEntry,
  IHubRequestOptions,
  lookupDomain,
  RemoteServerError,
} from '@esri/hub-common';
import { IContentSearchRequest, SortDirection } from '@esri/hub-search';

import { version } from '../package.json';
import { getDataStreamDcatAp201 } from './dcat-ap';
import { portalUrl } from './config';

let env: 'prod' | 'qa' | 'dev' = 'prod';
if (/devext\.|mapsdev\./.test(portalUrl)) {
  env = 'dev';
} else if (/qaext\.|mapsqa\./.test(portalUrl)) {
  env = 'qa';
}

/**
  * This function converts adlib'ed fields from the specified catalog into valid API fields used
  * to query the API for catalog content.
  * 
  * For fields that specify a path hierarchy using the || operator,
  * process each field as an API field EXCEPT for the last one.
  * The last field is interpreted as EITHER a templated value (e.g. `"modifed")
  * OR a literal value (e.g. "my literal value")
  * See "Path Hierarchies and Defaults" at https://github.com/Esri/adlib
  * 
  * Because the last field can be interpreted as either, with no syntax to differentiate,
  * the last field will be treated as a literal if it is not a valid Hub API field. As such,
  * it is not converted to a Hub API field
  * 
  * @param dependencies - list of fields processed by adlib to use when building the catalog
  * @returns - a list of valid Hub API fields
*/
async function getApiTermsFromDependencies (dependencies: string[]) {
  if (!dependencies || !Array.isArray(dependencies)) return undefined;

  // Only get valid Hub API fields if they are needed
  const doesPathHierarchyExist = dependencies.filter(dep => dep.includes('||')).length;
  const validApiFields: string[] = doesPathHierarchyExist ? await hubApiRequest('fields') : [];
  const validApiFieldMap = validApiFields.reduce((fieldMap, field) => {
    fieldMap[field] = true;
    return fieldMap;
  }, {});

  return Array.from(new Set(_.flatten(dependencies.map(dep => {
    // Dependency could indicate a hierarchial path (e.g. orgEmail || author)
    if (dep.includes('||')) {
      const providedSubDeps = dep.split('||').map(subDep => subDep.trim()).filter(subDep => !!subDep);
      const returnedSubDeps = [];

      // Assume all non-last fields are valid API fields
      for (let i = 0; i < providedSubDeps.length - 1; i++) {
        returnedSubDeps.push(providedSubDeps[i].split('.')[0]);
      }

      // Only push the last one if its a valid API field
      if (validApiFieldMap[providedSubDeps[providedSubDeps.length - 1]]) {
        returnedSubDeps.push(providedSubDeps[providedSubDeps.length - 1].split('.')[0]);
      }

      return returnedSubDeps;
    }
    return dep.split('.')[0];
  }))));
}

/**
 * Sort field map that connects English versions of sort fields
 * to API sort field keys
 */
 const sortFieldMap = {
  'Date Created': 'created',
  'Date Modified': 'modified',
};

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

      // Use dcatConfig query param if provided, else default to site's config
      let dcatConfig = typeof req.query.dcatConfig === 'string'
        ? this.parseProvidedDcatConfig(req.query.dcatConfig as string)
        : req.query.dcatConfig;
    
      if (!dcatConfig) {
        dcatConfig = _.get(siteModel, 'data.feeds.dcatAP201');
      }

      const orgBaseUrl = `https://${domainRecord.orgKey}.maps${
        env === 'prod' ? '' : env
      }.arcgis.com`;

      // TODO: We only pass in hostname because some site item urls are out of sync, causing invalid urls for
      // hubLandingPage and identifier. If we can resolve the syncing issues, we can omit hostname and just use
      // the absolute url we get from getContentSiteUrls()

      const { dcatStream, dependencies } = getDataStreamDcatAp201({
        domainRecord,
        siteUrl: req.hostname,
        siteModel,
        orgBaseUrl,
        customFormatTemplate: dcatConfig
      });

      const apiTerms = await getApiTermsFromDependencies(dependencies);
      
      // Construct request to send, send empty if no id or catalog
      const id = String(req.query.id || '');
      const siteCatalog = _.get(siteModel, 'data.catalog');

      if (!id && !siteCatalog) {
        res.status(200).send({});
        return;
      }
  
      req.res.locals.searchRequest = id 
        ? this.getDatasetSearchRequest({ id, fields: apiTerms })
        : this.getCatalogSearchRequest({ req, catalog: siteCatalog, fields: apiTerms });

      const datasetStream = await this.getDatasetStream(req);

      datasetStream
        .pipe(dcatStream)
        .pipe(res)
        .on('error', (err: any) => {
          res.status(500).send(this.getErrorResponse(err));
        });
    } catch (err) {
      res.status(err.status || 500).send(this.getErrorResponse(err));
    }
  }

  private async fetchDomainAndSite(hostname) {
    const requestOptions = this.getRequestOptions(portalUrl);

    try {
      const domainRecord = (await lookupDomain(
        hostname,
        requestOptions,
      )) as IDomainEntry;
      const siteModel = await getSiteById(domainRecord.siteId, requestOptions);
  
      return { domainRecord, siteModel };
    } catch (err) {

      // Throw 404 if domain does not exist (first) or site is private (second)
      if (err.message.includes(':: 404') || err.response?.error?.code === 403) {
        throw new RemoteServerError(err.message, null, 404);
      }
      throw new RemoteServerError(err.message, null, 500);
    }
  }

  private parseProvidedDcatConfig(dcatConfig: string) {
    try {
      return JSON.parse(dcatConfig);
    } catch (err) {
      return undefined;
    }
  }

  private getRequestOptions(portalUrl: string): IHubRequestOptions {
    return {
      isPortal: false,
      hubApiUrl: getHubApiUrl(portalUrl),
      portal: getPortalApiUrl(portalUrl),
      authentication: null,
    };
  }

  private getDatasetSearchRequest(opts: {
    id: string,
    fields: string[]
  }): IContentSearchRequest {
    const searchRequest: IContentSearchRequest = {
      filter: { id: opts.id },
      options: {
        portal: portalUrl,
        fields: opts.fields ? opts.fields.join(',') : undefined
      },
    };
    return searchRequest;

  }

  private getCatalogSearchRequest(opts: {
    req: Request,
    catalog: any,
    fields: string[]
  }): IContentSearchRequest {
    const searchRequest: IContentSearchRequest = {
      filter: {
        group: opts.catalog.groups,
        orgid: opts.catalog.orgId,
      },
      options: {
        portal: portalUrl,
        fields: opts.fields ? opts.fields.join(',') : undefined,
      },
    };

    if (typeof _.get(opts, 'req.query.q') === 'string' && opts.req.query.q.length > 0) {
      searchRequest.filter.terms = opts.req.query.q as string;
    }

    const sortOptions = this.getSortOptions(_.get(opts, 'req.query.sort', undefined));
    if (sortOptions) {
      searchRequest.options.sortField = sortOptions.sortField;
      searchRequest.options.sortOrder = sortOptions.sortOrder;
    }
    return searchRequest;
  }

  private getSortOptions(sortQuery: string): { sortField?: string; sortOrder?: SortDirection } {
    if (typeof sortQuery !== 'string' || !sortQuery.length) {
      return undefined;
    }

    const sortOptions = sortQuery.split('|');
    
    const sortField = sortOptions.length > 1 ? sortOptions[1] : sortFieldMap[sortOptions[0]];
    const sortOrder = sortOptions.length > 2 ? sortOptions[2] as SortDirection : SortDirection.desc;
    return {
      sortField,
      sortOrder,
    };
  }

  private async getDatasetStream(req: Request) {
    try {
      return await this.model.pullStream(req);
    } catch (err) {
      if (err.status === 400) {
        throw new RemoteServerError(err.message, null, 400);
      }
      throw new RemoteServerError(err.message, null, 500);
    }
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
