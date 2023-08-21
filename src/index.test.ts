import { mocked } from 'ts-jest/utils';
import * as express from 'express';
import * as request from 'supertest';
import * as _ from 'lodash';
import * as mockSiteModel from './test-helpers/mock-site-model.json';
import * as mockDataset from './test-helpers/mock-dataset.json';
import { readableFromArray } from './test-helpers/stream-utils';
import { DcatApError } from './dcat-ap/dcat-ap-error';

describe('Output Plugin', () => {
  let mockFetchSite;
  let plugin;
  let app: express.Application;

  const siteHostName = 'download-test-qa-pre-a-hub.hubqa.arcgis.com';

  function buildPluginAndApp(feedTemplate, feedTemplateTransforms) {
    let Output;

    jest.isolateModules(() => {
      Output = require('./');
    });

    const plugin = new Output();
    plugin.model = {
      pullStream: jest.fn().mockResolvedValue(readableFromArray([mockDataset])),
    };

    app = express();
    app.get('/dcat', function (req, res, next) {
      req.app.locals.feedTemplateTransforms = feedTemplateTransforms;
      res.locals.feedTemplate = feedTemplate;
      next();
    }, plugin.serve.bind(plugin));

    return [plugin, app];
  }

  beforeEach(() => {
    const { fetchSite } = require('@esri/hub-common');
    // this fancy code is just to _only_ mock some fns
    // and leave the rest alone
    jest.mock('@esri/hub-common', () => ({
      ...(jest.requireActual('@esri/hub-common') as object),
      fetchSite: jest.fn(),
      hubApiRequest: jest.fn()
    }));

    const dcatTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      issued: '{{created}}'
    }

    mockFetchSite = mocked(fetchSite);

    mockFetchSite.mockResolvedValue(mockSiteModel);

    [plugin, app] = buildPluginAndApp(dcatTemplate, {});
  });

  it('is configured correctly', () => {
    expect(plugin.constructor.type).toBe('output');
    expect(plugin.constructor.version).toBeDefined();
    expect(plugin.constructor.routes).toEqual([
      {
        path: '/dcat-ap/2.1.1',
        methods: ['get'],
        handler: 'serve',
      }
    ]);
  });

  it('throws error if feed template is not found in request', async () => {
    // rebuild plugin to trigger initialization code
    const [plugin, localApp] = buildPluginAndApp(undefined, undefined);
    try {
      await request(localApp)
        .get('/dcat')
        .set('host', siteHostName)
        .expect('Content-Type', /application\/json/);
    } catch (error) {
      expect(error).toBeInstanceOf(DcatApError);
      expect(error).toHaveProperty('statusCode', 400);
      expect(plugin.model.pullStream).toHaveBeenCalledTimes(1);
    }
  });

  it('handles a DCAT US request', async () => {
    // rebuild plugin to trigger initialization code
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
        expect(dcatStream['@context']).toStrictEqual({
          dcat: 'http://www.w3.org/ns/dcat#',
          dct: 'http://purl.org/dc/terms/',
          foaf: 'http://xmlns.com/foaf/0.1/',
          vcard: 'http://www.w3.org/2006/vcard/ns#',
          ftype: 'http://publications.europa.eu/resource/authority/file-type/',
          lang: 'http://publications.europa.eu/resource/authority/language/',
          skos: "http://www.w3.org/2004/02/skos/core#"
        });
        expect(dcatStream['dcat:dataset']).toBeInstanceOf(Array);
        expect(dcatStream['dcat:dataset'].length).toBe(1);
      });
  });

  it('sets status to 500 if something blows up', async () => {
    plugin.model.pullStream.mockRejectedValue(Error('Couldnt get stream'));

    await request(app)
      .get('/dcat')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(500)
      .expect((res) => {
        expect(res.body).toEqual({ error: 'Couldnt get stream' });
      });

    // TODO test stream error
  });

  it('returns 400 when searchRequest returns 400', async () => {
    [plugin, app] = buildPluginAndApp({}, {});

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
});
