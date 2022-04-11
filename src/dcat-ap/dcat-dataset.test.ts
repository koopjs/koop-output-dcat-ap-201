import { cloneObject, IModel } from '@esri/hub-common';
import { getDcatDataset, getDownloadUrl, getOgcUrl, supportsWFS, supportsWMS } from './dcat-dataset';

import * as datasetFromApi from '../test-helpers/mock-dataset.json';

const siteUrl = 'https://foobar.hub.arcgis.com'
const siteModel = { item: { url: siteUrl } } as unknown as IModel;
const orgTitle = 'My Fun Org'
const orgBaseUrl = 'https://my-fun-org.maps.arcgis.com'

describe('getDcatDataset', () => {

  it('Dataset props come from right places', function() {
    const dataset = getDcatDataset(datasetFromApi, orgBaseUrl, orgTitle, siteUrl, siteModel)

    expect(dataset.id).toBe('f4bcc1035b7d46cba95e977f4affb6be_0')
    expect(dataset.url).toBe(
      'https://servicesqa.arcgis.com/Xj56SBi2udA78cC9/arcgis/rest/services/Tahoe_Things/FeatureServer/0'
    )
    expect(dataset.landingPage).toBe(
      'https://foobar.hub.arcgis.com/datasets/qa-pre-a-hub::tahoe-places-of-interest'
    )
    expect(dataset.downloadLink).toBe(
      'https://foobar.hub.arcgis.com/datasets/qa-pre-a-hub::tahoe-places-of-interest'
    )
    expect(dataset.name).toBe('Tahoe places of interest')
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
    expect(dataset.orgContactEmail).toBe('mailto:email@service.com');
    expect(dataset.provenance).toBe(
      'Myndigheten för samhällsskydd och beredskap ( https://www.msb.se/ ); con terra ( https://www.conterra.de/); Esri (https://www.esri.com/en-us/arcgis/products/arcgis-for-inspire)'
    )
  })

  it('non-metadata fallbacks', function() {
    const noMetadata = cloneObject(datasetFromApi)
    delete noMetadata.metadata

    const dataset = getDcatDataset(noMetadata, orgBaseUrl, orgTitle, siteUrl, siteModel)

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
      getDcatDataset({ ...pageDataset, tags: undefined }, orgBaseUrl, orgTitle, siteUrl, siteModel).keyword
    ).toEqual(expectedKeywords);
    expect(
      getDcatDataset({ ...pageDataset, tags: [] }, orgBaseUrl, orgTitle, siteUrl, siteModel).keyword
    ).toEqual(expectedKeywords);
    expect(
      getDcatDataset({ ...pageDataset, tags: [''] }, orgBaseUrl, orgTitle, siteUrl, siteModel).keyword
    ).toEqual(expectedKeywords);
  })
  describe('Dcat Dataset Helpers', () => {
    it('getDownloadUrl()', function() {
      const noSR = cloneObject(datasetFromApi)
      const withSR = cloneObject(datasetFromApi)
  
      delete noSR.server.spatialReference;
  
      withSR.server.spatialReference = {
        wkid: 4325,
        latestWkid: 8374
      }
  
      const datasetNoSR = getDcatDataset(noSR, orgBaseUrl, orgTitle, siteUrl, siteModel)
      const datasetSR = getDcatDataset(withSR, orgBaseUrl, orgTitle, siteUrl, siteModel)
  
      expect(getDownloadUrl(datasetNoSR, 'geojson')).toBe(
        'https://foobar.hub.arcgis.com/datasets/qa-pre-a-hub::tahoe-places-of-interest.geojson'
      )
      expect(getDownloadUrl(datasetSR, 'csv')).toBe(
        'https://foobar.hub.arcgis.com/datasets/qa-pre-a-hub::tahoe-places-of-interest.csv?outSR=%7B%22latestWkid%22%3A8374%2C%22wkid%22%3A4325%7D'
      )
    })
  
    it('getOgcUrl()', function() {
      const dataset = getDcatDataset(datasetFromApi, orgBaseUrl, orgTitle, siteUrl, siteModel)
  
      expect(getOgcUrl(dataset)).toBe(
        'https://servicesqa.arcgis.com/Xj56SBi2udA78cC9/arcgis/services/Tahoe_Things/FeatureServer/WMSServer?request=GetCapabilities&service=WMS'
      )
      expect(getOgcUrl(dataset, 'WFS')).toBe(
        'https://servicesqa.arcgis.com/Xj56SBi2udA78cC9/arcgis/services/Tahoe_Things/FeatureServer/WFSServer?request=GetCapabilities&service=WFS'
      )
    })

    it('supportsWFS() and supportsWMS() correctly reports WFS/WMS support', function() {
      const hubDatasetWFS = cloneObject(datasetFromApi)
      const hubDatasetWMS = cloneObject(datasetFromApi)
  
      hubDatasetWFS.supportedExtensions = 'WFSServer'
      hubDatasetWMS.supportedExtensions = 'WMSServer'
  
      const dcatDatasetWFS = getDcatDataset(hubDatasetWFS, orgBaseUrl, orgTitle, siteUrl, siteModel)
      const dcatDatasetWMS = getDcatDataset(hubDatasetWMS, orgBaseUrl, orgTitle, siteUrl, siteModel)
  
      expect(supportsWFS(dcatDatasetWFS)).toBeTruthy()
      expect(supportsWMS(dcatDatasetWFS)).toBeFalsy()
  
      expect(supportsWMS(dcatDatasetWMS)).toBeTruthy()
      expect(supportsWFS(dcatDatasetWMS)).toBeFalsy()
    })

  });
})