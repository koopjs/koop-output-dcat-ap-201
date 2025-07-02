import {
  readableFromArray,
  streamToString,
} from '../test-helpers/stream-utils';
import { getDataStreamDcatAp } from './';
import * as datasetFromApi from '../test-helpers/mock-dataset.json';

async function generateDcatFeed(dataset, template, templateTransforms, version) {
  const { dcatStream } = getDataStreamDcatAp(template, templateTransforms, version);
  const docStream = readableFromArray([dataset]); // no datasets since we're just checking the catalog
  const feedString = await streamToString(docStream.pipe(dcatStream));
  return { feed: JSON.parse(feedString) };
}

describe('generating DCAT-AP 2.0.1 feed', () => {
  it('formats catalog correctly with version', async function () {
    const { feed } = await generateDcatFeed([], {}, {}, '2.0.1');

    expect(feed['@context']).toBeDefined();
    expect(feed['@context']).toStrictEqual({
      dcat: 'http://www.w3.org/ns/dcat#',
      dct: 'http://purl.org/dc/terms/',
      foaf: 'http://xmlns.com/foaf/0.1/',
      vcard: 'http://www.w3.org/2006/vcard/ns#',
      ftype: 'http://publications.europa.eu/resource/authority/file-type/',
      lang: 'http://publications.europa.eu/resource/authority/language/',
      skos: 'http://www.w3.org/2004/02/skos/core#',
      access: 'http://publications.europa.eu/resource/authority/access-right/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    });
    expect(feed['dcat:dataset']).toBeInstanceOf(Array);
    expect(feed['dcat:dataset'].length).toBe(1);
    expect(Array.isArray(feed['dcat:dataset'])).toBeTruthy();
  });

  it('should interprolate dataset stream to feed based upon template', async function () {
    const dcatTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      publisher: {
        name: '{{source}}',
      },
      issued: '{{created:toISO}}',
      modified: '{{modified:toISO}}',
      contactPoint: {
        '@type': 'vcard:Contact',
        fn: '{{owner}}',
        hasEmail: '{{orgContactEmail:optional}}',
      },
      header: {
        '@id': 'arcgis.com',
        '@type': 'dcat:Catalog',
      },
    };
    const templateTransforms = {
      toISO: (_key, val) => {
        return new Date(val).toISOString();
      },
    };

    const { feed } = await generateDcatFeed(
      datasetFromApi,
      dcatTemplate,
      templateTransforms,
      '2.0.1'
    );
    expect(feed['@id']).toBe('arcgis.com');
    expect(feed['@type']).toBe('dcat:Catalog');
    expect(Array.isArray(feed['dcat:dataset'])).toBeTruthy();
    expect(feed['dcat:dataset'].length).toBe(1);
    const feedResponse = feed['dcat:dataset'][0];
    expect(feedResponse.title).toBe('Tahoe places of interest');
    expect(feedResponse.description).toBe(
      'Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.<div><br /></div><div>with more words</div><div><br /></div><div>adding a few more to test how long it takes for our jobs to execute.</div><div><br /></div><div>Tom was here!</div>',
    );
    expect(feedResponse.issued).toBe('2021-01-29T15:34:38.000Z');
    expect(feedResponse.modified).toBe('2021-07-27T20:25:19.723Z');
    expect(feedResponse.contactPoint).toStrictEqual({
      '@type': 'vcard:Contact',
      fn: 'thervey_qa_pre_a_hub',
    });
    expect(feedResponse.publisher).toStrictEqual({
      name: 'QA Premium Alpha Hub',
    });
    expect(feedResponse.keyword).toStrictEqual([
      'Data collection',
      'just modified',
    ]);
  });

  it('should interpolate dataset stream to feed based upon template', async function () {
    const dcatTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      publisher: {
        name: '{{source}}',
      },
      issued: '{{created:toISO}}',
      modified: '{{modified:toISO}}',
      contactPoint: {
        '@type': 'vcard:Contact',
        fn: '{{owner}}',
        hasEmail: '{{orgContactEmail:optional}}',
      },
    };
    const templateTransforms = {
      toISO: (_key, val) => {
        return new Date(val).toISOString();
      },
    };

    const { feed } = await generateDcatFeed(
      datasetFromApi,
      dcatTemplate,
      templateTransforms,
      '2.0.1'
    );
    expect(feed['@id']).toBeUndefined();
    expect(feed['@type']).toBeUndefined();
    expect(Array.isArray(feed['dcat:dataset'])).toBeTruthy();
    expect(feed['dcat:dataset'].length).toBe(1);
    const feedResponse = feed['dcat:dataset'][0];
    expect(feedResponse.title).toBe('Tahoe places of interest');
    expect(feedResponse.description).toBe(
      'Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.<div><br /></div><div>with more words</div><div><br /></div><div>adding a few more to test how long it takes for our jobs to execute.</div><div><br /></div><div>Tom was here!</div>',
    );
    expect(feedResponse.issued).toBe('2021-01-29T15:34:38.000Z');
    expect(feedResponse.modified).toBe('2021-07-27T20:25:19.723Z');
    expect(feedResponse.contactPoint).toStrictEqual({
      '@type': 'vcard:Contact',
      fn: 'thervey_qa_pre_a_hub',
    });
    expect(feedResponse.publisher).toStrictEqual({
      name: 'QA Premium Alpha Hub',
    });
    expect(feedResponse.keyword).toStrictEqual([
      'Data collection',
      'just modified',
    ]);
  });
});

describe('generating DCAT-AP 3.0.0 feed', () => {
  it('formats catalog correctly with version', async function () {
    const { feed } = await generateDcatFeed([], {}, {}, '3.0.0');

    expect(feed['@context']).toBeDefined();
    expect(feed['@context']).toStrictEqual({
      '@version': 1.1,
      '@protected': true,
      adms: 'http://www.w3.org/ns/adms#',
      cnt: 'http://www.w3.org/2011/content#',
      dash: 'http://datashapes.org/dash#',
      dcat: 'http://www.w3.org/ns/dcat#',
      dcatap: 'http://data.europa.eu/r5r/',
      'dcat-us': 'http://data.resources.gov/ontology/dcat-us#',
      'dcat-us-shp': 'http://data.resources.gov/shapes/dcat-us#',
      dcterms: 'http://purl.org/dc/terms/',
      dqv: 'http://www.w3.org/ns/dqv#',
      foaf: 'http://xmlns.com/foaf/0.1/',
      gsp: 'http://www.opengis.net/ont/geosparql#',
      locn: 'http://www.w3.org/ns/locn#',
      odrs: 'http://schema.theodi.org/odrs#',
      org: 'http://www.w3c.org/ns/org#',
      owl: 'http://www.w3.org/2002/07/owl#',
      prov: 'http://www.w3.org/ns/prov#',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      schema: 'http://schema.org/',
      sh: 'http://www.w3.org/ns/shacl#',
      skos: 'http://www.w3.org/2004/02/skos/core#',
      'sdmx-attribute': 'http://purl.org/linked-data/sdmx/2009/attribute#',
      spdx: 'http://spdx.org/rdf/terms#',
      vcard: 'http://www.w3.org/2006/vcard/ns#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    });
    expect(feed['dcat:dataset']).toBeInstanceOf(Array);
    expect(feed['dcat:dataset'].length).toBe(1);
    expect(Array.isArray(feed['dcat:dataset'])).toBeTruthy();
  });

  it('should interprolate dataset stream to feed based upon template', async function () {
    const dcatTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      publisher: {
        name: '{{source}}',
      },
      issued: '{{created:toISO}}',
      modified: '{{modified:toISO}}',
      contactPoint: {
        '@type': 'vcard:Contact',
        fn: '{{owner}}',
        hasEmail: '{{orgContactEmail:optional}}',
      },
      header: {
        '@id': 'arcgis.com',
        '@type': 'dcat:Catalog',
      },
    };
    const templateTransforms = {
      toISO: (_key, val) => {
        return new Date(val).toISOString();
      },
    };

    const { feed } = await generateDcatFeed(
      datasetFromApi,
      dcatTemplate,
      templateTransforms,
      '3.0.0',
    );
    expect(feed['@id']).toBe('arcgis.com');
    expect(feed['@type']).toBe('dcat:Catalog');
    expect(Array.isArray(feed['dcat:dataset'])).toBeTruthy();
    expect(feed['dcat:dataset'].length).toBe(1);
    const feedResponse = feed['dcat:dataset'][0];
    expect(feedResponse.title).toBe('Tahoe places of interest');
    expect(feedResponse.description).toBe(
      'Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.<div><br /></div><div>with more words</div><div><br /></div><div>adding a few more to test how long it takes for our jobs to execute.</div><div><br /></div><div>Tom was here!</div>',
    );
    expect(feedResponse.issued).toBe('2021-01-29T15:34:38.000Z');
    expect(feedResponse.modified).toBe('2021-07-27T20:25:19.723Z');
    expect(feedResponse.contactPoint).toStrictEqual({
      '@type': 'vcard:Contact',
      fn: 'thervey_qa_pre_a_hub',
    });
    expect(feedResponse.publisher).toStrictEqual({
      name: 'QA Premium Alpha Hub',
    });
    expect(feedResponse.keyword).toStrictEqual([
      'Data collection',
      'just modified',
    ]);
  });

  it('should interpolate dataset stream to feed based upon template', async function () {
    const dcatTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      publisher: {
        name: '{{source}}',
      },
      issued: '{{created:toISO}}',
      modified: '{{modified:toISO}}',
      contactPoint: {
        '@type': 'vcard:Contact',
        fn: '{{owner}}',
        hasEmail: '{{orgContactEmail:optional}}',
      },
    };
    const templateTransforms = {
      toISO: (_key, val) => {
        return new Date(val).toISOString();
      },
    };

    const { feed } = await generateDcatFeed(
      datasetFromApi,
      dcatTemplate,
      templateTransforms,
      '3.0.0'
    );
    expect(feed['@id']).toBeUndefined();
    expect(feed['@type']).toBeUndefined();
    expect(Array.isArray(feed['dcat:dataset'])).toBeTruthy();
    expect(feed['dcat:dataset'].length).toBe(1);
    const feedResponse = feed['dcat:dataset'][0];
    expect(feedResponse.title).toBe('Tahoe places of interest');
    expect(feedResponse.description).toBe(
      'Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.<div><br /></div><div>with more words</div><div><br /></div><div>adding a few more to test how long it takes for our jobs to execute.</div><div><br /></div><div>Tom was here!</div>',
    );
    expect(feedResponse.issued).toBe('2021-01-29T15:34:38.000Z');
    expect(feedResponse.modified).toBe('2021-07-27T20:25:19.723Z');
    expect(feedResponse.contactPoint).toStrictEqual({
      '@type': 'vcard:Contact',
      fn: 'thervey_qa_pre_a_hub',
    });
    expect(feedResponse.publisher).toStrictEqual({
      name: 'QA Premium Alpha Hub',
    });
    expect(feedResponse.keyword).toStrictEqual([
      'Data collection',
      'just modified',
    ]);
  });
});
