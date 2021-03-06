import { mocked } from 'ts-jest/utils';
import * as express from 'express';
import * as request from 'supertest';
import * as _ from 'lodash';

import { IHubRequestOptions, IModel } from '@esri/hub-common';

import { FeedFormatterStream } from './dcat-ap/feed-formatter-stream';
import * as mockDomainRecord from './test-helpers/mock-domain-record.json';
import * as mockSiteModel from './test-helpers/mock-site-model.json';
import * as mockDataset from './test-helpers/mock-dataset.json';
import { readableFromArray } from './test-helpers/stream-utils';

describe('Output Plugin', () => {
  let mockConfigModule;
  let mockLookupDomain;
  let mockGetSite;
  let mockHubApiRequest;
  let plugin;
  let app: express.Application;

  const siteHostName = 'download-test-qa-pre-a-hub.hubqa.arcgis.com';

  function buildPluginAndApp () {
    let Output;
    
    jest.isolateModules(() => {
      Output = require('./');
    });

    const plugin = new Output();
    plugin.model = {
      pullStream: jest.fn().mockResolvedValue(readableFromArray([mockDataset])),
    };

    app = express();
    app.get('/dcat', plugin.serve.bind(plugin));

    return [ plugin, app ];
  }

  beforeEach(() => {
    jest.resetModules();

    const {
      lookupDomain,
      getSiteById,
      hubApiRequest
    } = require('@esri/hub-common');
    // this fancy code is just to _only_ mock some fns
    // and leave the rest alone
    jest.mock('@esri/hub-common', () => ({
      ...(jest.requireActual('@esri/hub-common') as object),
      getSiteById: jest.fn(),
      lookupDomain: jest.fn(),
      hubApiRequest: jest.fn()
    }));

    mockConfigModule = mocked(require('config'), true);
    jest.mock('config');

    mockLookupDomain = mocked(lookupDomain);
    mockLookupDomain.mockResolvedValue(mockDomainRecord);

    mockGetSite = mocked(getSiteById);
    mockGetSite.mockResolvedValue(mockSiteModel);

    mockHubApiRequest = mocked(hubApiRequest);
  });

  it('is configured correctly', () => {
    [ plugin, app ] = buildPluginAndApp();

    expect(plugin.constructor.type).toBe('output');
    expect(plugin.constructor.version).toBeDefined();
    expect(plugin.constructor.routes).toEqual([
      {
        path: '/dcat-ap/2.0.1',
        methods: ['get'],
        handler: 'serve',
      },
    ]);
  });

  it('handles a DCAT request', async () => {
    [ plugin, app ] = buildPluginAndApp();

    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .expect(res => {
        expect(res.body).toBeDefined();

        // perform some basic checks to make sure we have
        // something that looks like a DCAT feed
        const dcatStream = res.body;
        expect(dcatStream['@context']).toBeDefined();
        expect(dcatStream['@id']).toBe('https://download-test-qa-pre-a-hub.hubqa.arcgis.com');
        expect(dcatStream['dcat:dataset']).toBeInstanceOf(Array);
        expect(dcatStream['dcat:dataset'].length).toBe(1);
        expect(dcatStream['dcat:dataset'][0]['dcat:distribution']).toBeInstanceOf(Array);
      });

    const expectedRequestOptions: IHubRequestOptions = {
      authentication: null,
      hubApiUrl: 'https://hub.arcgis.com',
      isPortal: false,
      portal: 'https://www.arcgis.com/sharing/rest',
    };

    expect(mockLookupDomain).toHaveBeenCalledWith(siteHostName, expectedRequestOptions);
    expect(mockGetSite).toHaveBeenCalledWith('6250d80d445740cc83e03a15d72229b5', expectedRequestOptions);

    const expressRequest: express.Request = plugin.model.pullStream.mock.calls[0][0];
    expect(expressRequest.res.locals.searchRequest).toEqual({
      filter: {
        group: [
          "3b9ffb00851f47dab74494018ffa00fb",
          "95cc82a857fb40038628eea0dfc0210f",
          "671f07ab39bc4ea5a345d523328ccc06",
          "e79e2021e843428e9e0dab77eadbd507",
          "28a62e584bf04d5e8ade7e23467b7457"
        ],
        orgid: 'Xj56SBi2udA78cC9'
      },
      options: {
        portal: 'https://www.arcgis.com',
        fields: 'id,access,size,slug,url,owner,name,type,typeKeywords,tags,description,culture,created,metadata,server,geometryType,orgContactEmail'
      }
    })
  });

  it('points at AGO environment from config', async () => {
    const qaPortal = 'https://qaext.arcgis.com';

    mockConfigModule.has.mockReturnValue(true);
    mockConfigModule.get.mockReturnValue(qaPortal);

    // rebuild plugin to trigger initialization code
    [ plugin, app ] = buildPluginAndApp();

    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .expect(res => {
        expect(res.body['dct:creator']['@id']).toBe('https://qa-pre-a-hub.mapsqa.arcgis.com')
      });

    expect(mockConfigModule.has).toHaveBeenCalledWith('arcgisPortal');
    expect(mockConfigModule.get).toHaveBeenCalledWith('arcgisPortal');

    const expectedRequestOptions: IHubRequestOptions = {
      authentication: null,
      hubApiUrl: 'https://hubqa.arcgis.com',
      isPortal: false,
      portal: 'https://qaext.arcgis.com/sharing/rest',
    };

    expect(mockLookupDomain).toHaveBeenCalledWith(siteHostName, expectedRequestOptions);
    expect(mockGetSite).toHaveBeenCalledWith('6250d80d445740cc83e03a15d72229b5', expectedRequestOptions);

    const expressRequest: express.Request = plugin.model.pullStream.mock.calls[0][0];
    expect(expressRequest.res.locals.searchRequest.options.portal).toBe(qaPortal)
  });

  it('sets status to 500 if something blows up', async () => {
    [ plugin, app ] = buildPluginAndApp();

    mockGetSite.mockRejectedValue(Error('404 site not found'));

    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(500)
      .expect(res => {
        expect(res.body).toEqual({ error: '404 site not found' });
      });

    // TODO test stream error
  });

  it('returns empty response if no site catalog', async () => {
    [ plugin, app ] = buildPluginAndApp();

    const siteWithoutCatalogOrFeed: IModel = _.cloneDeep(mockSiteModel);
    siteWithoutCatalogOrFeed.data = {}
    mockGetSite.mockResolvedValue(siteWithoutCatalogOrFeed);

    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual({});
      });
  });

  it('returns 400 when searchRequest returns 400', async () => {
    [ plugin, app ] = buildPluginAndApp();
  
    plugin.model = {
      pullStream: jest.fn().mockRejectedValue({ status: 400, message: 'A validation error' })
    }

    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(400)
      .expect(res => {
        expect(plugin.model.pullStream).toHaveBeenCalledTimes(1);
        expect(res.body).toBeDefined();
        expect(res.body.error).toEqual('A validation error');
      });
  });

  it('returns 404 when provided domain does not exist and domain service returns appropriate message', async () => {
    [ plugin, app ] = buildPluginAndApp();
  
    mockLookupDomain.mockRejectedValue({ message: 'DOMAIN DOES NOT EXIST :: 404' })
    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(404)
      .expect(res => {
        expect(res.body).toBeDefined();
        expect(res.body.error).toEqual('DOMAIN DOES NOT EXIST :: 404');
      });
  });

  it('returns 500 when provided domain does not exist and domain service returns wrong message', async () => {
    [ plugin, app ] = buildPluginAndApp();
  
    mockLookupDomain.mockRejectedValue({ message: 'DOMAIN DOES NOT EXIST :: 403' })
    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(500)
      .expect(res => {
        expect(res.body).toBeDefined();
        expect(res.body.error).toEqual('DOMAIN DOES NOT EXIST :: 403');
      });
  });

  it('returns 404 when provided domain represents a private site', async () => {
    [ plugin, app ] = buildPluginAndApp();
  
    mockGetSite.mockRejectedValue({ message: 'PRIVATE SITE', response: { error: { code: 403 } } })
    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(404)
      .expect(res => {
        expect(res.body).toBeDefined();
        expect(res.body.error).toEqual('PRIVATE SITE');
      });
  });

  it('returns 500 when ArcGIS returns wrong error for a site item', async () => {
    [ plugin, app ] = buildPluginAndApp();
  
    mockGetSite.mockRejectedValue({ message: 'PRIVATE SITE' })
    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(500)
      .expect(res => {
        expect(res.body).toBeDefined();
        expect(res.body.error).toEqual('PRIVATE SITE');
      });
  });

  describe('feed configurations', () => {
    let mockGetDataStreamDcatAp201;

    beforeEach(() => {
      const { getDataStreamDcatAp201 } = require('./dcat-ap');

      jest.mock('./dcat-ap', () => ({
        ...(jest.requireActual('./dcat-ap') as object),
        getDataStreamDcatAp201: jest.fn()
      }));
  
      mockGetDataStreamDcatAp201 = mocked(getDataStreamDcatAp201)
        .mockReturnValue({
          dcatStream: new FeedFormatterStream('{', '}', '', () => ''),
          dependencies: []
        });
    });

    afterEach(() => {
      mockGetDataStreamDcatAp201.mockRestore();
    });

    it("Properly passes a site's custom dcat configuration to getDataStreamAp201 when present", async () => {
      [ plugin, app ] = buildPluginAndApp();

      const customConfigSiteModel: IModel = _.cloneDeep(mockSiteModel);
      customConfigSiteModel.data.feeds = {
        dcatAP201: {
          'dct:title': '{{name}}',
          'dct:description': '{{description}}',
          'dcat:contactPoint': {
              'vcard:fn': '{{owner}}',
              'vcard:hasEmail': '{{orgContactEmail}}',
          },
          'dct:newAttribute': '{{path.to.attribute}}'
        }
      }
      mockGetSite.mockResolvedValue(customConfigSiteModel);

      await request(app)
        .get('/dcat')
        .set('host', siteHostName)
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .expect(() => {
          expect(mockGetDataStreamDcatAp201)
            .toHaveBeenCalledWith({
              domainRecord: mockDomainRecord,
              siteModel: customConfigSiteModel,
              siteUrl: siteHostName,
              orgBaseUrl: 'https://qa-pre-a-hub.maps.arcgis.com',
              customFormatTemplate: customConfigSiteModel.data.feeds.dcatAP201
            });
        });
    });

    it('Properly converts adlib path hierarchies to Hub API Fields', async () => {
      [ plugin, app ] = buildPluginAndApp();

      const customConfigSiteModel: IModel = _.cloneDeep(mockSiteModel);
      customConfigSiteModel.data.feeds = {
        dcatAP201: {
          "hierarchyTwoValidApiFields": "{{venue || openData}}",
          "hierarchyLastFieldIsInvalidApiField": "{{contentStatus || a_literal}}",
          "hierarchyThreeValidApiFieldsOneInvalid": "{{itemModified || region || recordCount || another_literal}}",
          "hierarchyOneDuplicateValue": "{{snippet || openData}}"
        }
      }
  
      mockGetSite.mockResolvedValue(customConfigSiteModel);
  
      mockGetDataStreamDcatAp201.mockReturnValue({
        dcatStream: new FeedFormatterStream('{', '}', '', () => ''),
        dependencies: [
        'venue || openData', 'contentStatus || a_literal',
        'itemModified || region || recordCount || another_literal', 'snippet || openData'
        ]
      });

      mockHubApiRequest.mockResolvedValue([
        'venue', 'openData', 'contentStatus', 'itemModified', 'region', 'recordCount', 'snippet'
      ]);
  
      await request(app)
        .get('/dcat')
        .set('host', siteHostName)
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .expect(res => {
          expect(plugin.model.pullStream).toHaveBeenCalledTimes(1);
  
          const actualSearchRequest = _.get(plugin.model.pullStream, 'mock.calls[0][0].res.locals.searchRequest');
          const fieldsAsArray: string[] = actualSearchRequest.options.fields.split(',');
          expect(fieldsAsArray.includes('venue')).toBeTruthy();
          expect(fieldsAsArray.includes('openData')).toBeTruthy();
          expect(fieldsAsArray.includes('contentStatus')).toBeTruthy();
          expect(fieldsAsArray.includes('itemModified')).toBeTruthy();
          expect(fieldsAsArray.includes('region')).toBeTruthy();
          expect(fieldsAsArray.includes('recordCount')).toBeTruthy();
          expect(fieldsAsArray.includes('snippet')).toBeTruthy();
          expect(fieldsAsArray.includes('a_literal')).toBeFalsy();
          expect(fieldsAsArray.includes('another_literal')).toBeFalsy();
  
          expect(res.body).toBeDefined();
        });
    });
  });
});
