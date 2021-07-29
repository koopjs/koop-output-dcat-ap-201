import { mocked } from 'ts-jest/utils';

import { readableFromArray } from './test-helpers/stream-utils';
import * as express from 'express';
import { Application } from 'express-serve-static-core';
import * as request from 'supertest';
import {
  lookupDomain,
  getSiteById,
  IHubRequestOptions,
} from '@esri/hub-common';
import * as config from 'config';
jest.mock('config');

// this fancy code is just to _only_ mock some fns
// and leave the rest alone
jest.mock('@esri/hub-common', () => ({
  ...(jest.requireActual('@esri/hub-common') as object),
  getSiteById: jest.fn(),
  lookupDomain: jest.fn()
}));

import * as mockDomainRecord from './test-helpers/mock-domain-record.json';
import * as mockSiteModel from './test-helpers/mock-site-model.json';
import * as mockDataset from './test-helpers/mock-dataset.json';

const Output = require('./index');

describe('Output Plugin', () => {
  const mockConfigModule = mocked(config, true);
  const mockLookupDomain = mocked(lookupDomain);
  const mockGetSite = mocked(getSiteById);
  let plugin;
  let app: Application;

  beforeEach(() => {
    mockLookupDomain.mockResolvedValue(mockDomainRecord);
    mockGetSite.mockResolvedValue(mockSiteModel);

    plugin = new Output();
    plugin.model = {
      pullStream: jest.fn().mockResolvedValue(readableFromArray([mockDataset])),
    };

    app = express();
    app.get('/dcat', plugin.serve.bind(plugin));

    mockConfigModule.get.mockReturnValue('foobar');
  });

  it('is configured correctly', () => {
    expect(Output.type).toBe('output');
    expect(Output.version).toBeDefined();
    expect(Output.routes).toEqual([
      {
        path: '/dcat-ap/2.0.1',
        methods: ['get'],
        handler: 'serve',
      },
    ]);
  });

  it('handles a DCAT request', async () => {
    const siteHostName = 'download-test-qa-pre-a-hub.hubqa.arcgis.com';

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
        portal: 'https://www.arcgis.com'
      }
    })
  });
});
