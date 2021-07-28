import { cloneObject } from '@esri/hub-common';
import { DcatDataset } from './dcat-dataset';

import * as datasetFromApi from './test-helpers/mock-dataset.json';

const siteUrl = 'https://foobar.hub.arcgis.com'
const orgTitle = 'My Fun Org'
const portalUrl = 'https://my-fun-org.maps.arcgis.com'

describe('DcatDataset', () => {
  it('Dataset props come from right places', function() {
    const dataset = new DcatDataset(datasetFromApi, portalUrl, orgTitle, siteUrl)

    expect(dataset.id).toBe('f4bcc1035b7d46cba95e977f4affb6be_0')
    expect(dataset.url).toBe(
      'https://servicesqa.arcgis.com/Xj56SBi2udA78cC9/arcgis/rest/services/Tahoe_Things/FeatureServer/0'
    )
    expect(dataset.landingPage).toBe(
      'https://foobar.hub.arcgis.com/datasets/f4bcc1035b7d46cba95e977f4affb6be_0'
    )
    expect(dataset.title).toBe('Tahoe places of interest')
    expect(dataset.description).toBe('Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.<div><br /></div><div>with more words</div><div><br /></div><div>adding a few more to test how long it takes for our jobs to execute.</div><div><br /></div><div>Tom was here!</div>')
    expect(dataset.owner).toBe('thervey_qa_pre_a_hub')
    expect(dataset.ownerUri).toBe(
      'https://my-fun-org.maps.arcgis.com/sharing/rest/community/users/thervey_qa_pre_a_hub?f=json'
    )
    expect(dataset.language).toBe('ger')
    expect(dataset.keyword).toEqual([
      "some",
      "keywords",
      "from",
      "metadata"
    ])
    expect(dataset.issuedDateTime).toBe('2021-04-19T13:30:24.055-04:00')
    expect(dataset.orgTitle).toBe('My Fun Org')
    // TODO - update when this is available through the API
    expect(dataset.orgContactUrl).toBeNull();
    expect(dataset.provenance).toBe(
      'Myndigheten för samhällsskydd och beredskap ( https://www.msb.se/ ); con terra ( https://www.conterra.de/); Esri (https://www.esri.com/en-us/arcgis/products/arcgis-for-inspire)'
    )
  })

  it('non-metadata fallbacks', function() {
    const noMetadata = cloneObject(datasetFromApi)
    delete noMetadata.metadata

    const dataset = new DcatDataset(noMetadata, portalUrl, orgTitle, siteUrl)

    expect(dataset.language).toBe('eng')
    expect(dataset.keyword).toEqual(['Data collection', 'just modified'])
    expect(dataset.issuedDateTime).toBe('2021-01-29T15:34:38.000Z')
  })

  it('Hub Page has default keyword when has no tags', function() {
    const pageDataset = cloneObject(datasetFromApi)
    delete pageDataset.metadata
    pageDataset.type = 'Hub Page';

    const expectedKeywords = ['ArcGIS Hub page'];

    expect(
      new DcatDataset({ ...pageDataset, tags: undefined }, portalUrl, orgTitle, siteUrl).keyword
    ).toEqual(expectedKeywords);
    expect(
      new DcatDataset({ ...pageDataset, tags: [] }, portalUrl, orgTitle, siteUrl).keyword
    ).toEqual(expectedKeywords);
    expect(
      new DcatDataset({ ...pageDataset, tags: [''] }, portalUrl, orgTitle, siteUrl).keyword
    ).toEqual(expectedKeywords);
  })

  it('getDownloadUrl', function() {
    const noSR = cloneObject(datasetFromApi)
    const withSR = cloneObject(datasetFromApi)

    delete noSR.server.spatialReference;

    withSR.server.spatialReference = {
      wkid: 4325,
      latestWkid: 8374
    }

    const datasetNoSR = new DcatDataset(noSR, portalUrl, orgTitle, siteUrl)
    const datasetSR = new DcatDataset(withSR, portalUrl, orgTitle, siteUrl)

    expect(datasetNoSR.getDownloadUrl('geojson')).toBe(
      'https://foobar.hub.arcgis.com/datasets/f4bcc1035b7d46cba95e977f4affb6be_0.geojson'
    )
    expect(datasetSR.getDownloadUrl('csv')).toBe(
      'https://foobar.hub.arcgis.com/datasets/f4bcc1035b7d46cba95e977f4affb6be_0.csv?outSR=%7B%22latestWkid%22%3A8374%2C%22wkid%22%3A4325%7D'
    )
  })

  it('getOgcUrl', function() {
    const dataset = new DcatDataset(datasetFromApi, portalUrl, orgTitle, siteUrl)

    expect(dataset.getOgcUrl()).toBe(
      'https://servicesqa.arcgis.com/Xj56SBi2udA78cC9/arcgis/services/Tahoe_Things/FeatureServer/WMSServer?request=GetCapabilities&service=WMS'
    )
    expect(dataset.getOgcUrl('WFS')).toBe(
      'https://servicesqa.arcgis.com/Xj56SBi2udA78cC9/arcgis/services/Tahoe_Things/FeatureServer/WFSServer?request=GetCapabilities&service=WFS'
    )
  })

  // TODO - skipped until we expose these capabilities in the API
  it.skip('correctly reports WFS/WMS support', function() {
    const supportsWFS = cloneObject(datasetFromApi)
    const supportsWMS = cloneObject(datasetFromApi)

    // supportsWFS.server.supportedExtensions = 'WFSServer'
    // supportsWMS.server.supportedExtensions = 'WMSServer'

    const datasetWFS = new DcatDataset(supportsWFS, portalUrl, orgTitle, siteUrl)
    const datasetWMS = new DcatDataset(supportsWMS, portalUrl, orgTitle, siteUrl)

    expect(datasetWFS.supportsWFS).toBeTruthy()
    expect(datasetWFS.supportsWMS).toBeFalsy()

    expect(datasetWMS.supportsWMS).toBeTruthy()
    expect(datasetWMS.supportsWFS).toBeFalsy()
  })
})