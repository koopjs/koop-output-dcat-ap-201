import { formatDcatDataset } from './dcat-formatters';
import { defaultFormatTemplate }  from '../default-format-template';

const dataset: any = {
  landingPage: 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/0',
  id: '0',
  access: 'public',
  name: 'Jules Goes The Distance',
  description:
    'Create your own initiative by combining existing applications with a custom site. Use this initiative to form teams around a problem and invite your community to participate.',
  ownerUri: '',
  owner: 'jbartley',
  orgContactEmail: 'contact@funorg.com',
  orgTitle: '',
  language: 'eng',
  keyword: ['property', 'vacant', 'abandoned', 'revitalization'],
  provenance: 'provenance',
  issuedDateTime: 1498771743000,
  url: 'https://sampleserver3.arcgisonline.com/arcgis/rest/services/Earthquakes/RecentEarthquakesRendered/MapServer/0',
};

describe('formatDcatDataset', () => {
  it('DCAT dataset has correct format', function () {
    const expectedResult = {
      '@type': 'dcat:Dataset',
      '@id': dataset.landingPage,
      'dct:title': dataset.name,
      'dct:description': dataset.description,
      'dcat:contactPoint': {
        '@id': dataset.ownerUri,
        '@type': 'Contact',
        'vcard:fn': dataset.owner,
        'vcard:hasEmail': dataset.orgContactEmail,
      },
      'dct:publisher': dataset.orgTitle,
      'dcat:theme': 'geospatial',
      'dct:accessRights': 'public',
      'dct:identifier': dataset.landingPage,
      'dct:language': {
        '@id': `lang:${dataset.language.toUpperCase()}`,
      },
      'dcat:keyword': dataset.keyword,
      'dct:provenance': dataset.provenance,
      'dct:issued': dataset.issuedDateTime,
    };
    const result = JSON.parse(formatDcatDataset(dataset, defaultFormatTemplate));

    expect(result['@type']).toBe(expectedResult['@type']);
    expect(result['@id']).toBe(expectedResult['@id']);
    expect(result['dct:title']).toBe(expectedResult['dct:title']);
    expect(result['dct:description']).toBe(expectedResult['dct:description']);
    expect(result['dcat:contactPoint']).toEqual(
      expectedResult['dcat:contactPoint'],
    );
    expect(result['dct:publisher']).toBe(expectedResult['dct:publisher']);
    expect(result['dcat:theme']).toBe(expectedResult['dcat:theme']);
    expect(result['dct:accessRights']).toBe(expectedResult['dct:accessRights']);
    expect(result['dct:identifier']).toBe(expectedResult['dct:identifier']);
    expect(result['dct:language']).toEqual(expectedResult['dct:language']);
    expect(result['dcat:keyword']).toEqual(expectedResult['dcat:keyword']);
    expect(result['dct:provenance']).toBe(expectedResult['dct:provenance']);
    expect(result['dct:issued']).toBe(expectedResult['dct:issued']);
    expect(result['dcat:distribution']).toBeTruthy();
  });

  it('DCAT dataset has overriden license', function () {
    const expectedResult = {
      '@type': 'dcat:Dataset',
      '@id': dataset.landingPage,
      'dct:title': dataset.name,
      'dct:description': dataset.description,
      'dcat:contactPoint': {
        '@id': dataset.ownerUri,
        '@type': 'Contact',
        'vcard:fn': dataset.owner,
        'vcard:hasEmail': dataset.orgContactEmail,
      },
      'dct:publisher': dataset.orgTitle,
      'dcat:theme': 'geospatial',
      'dct:accessRights': 'public',
      'dct:identifier': dataset.landingPage,
      'dct:language': {
        '@id': `lang:${dataset.language.toUpperCase()}`,
      },
      'dcat:keyword': dataset.keyword,
      'dct:provenance': dataset.provenance,
      'dct:issued': dataset.issuedDateTime,
      'dct.license': 'a-common-license'
    };

    const datasetWithLicense = { ...dataset, license: 'none' }
    const template = { ...defaultFormatTemplate, 'dct.license': '{{license || a-common-license}}'}
    const result = JSON.parse(formatDcatDataset(datasetWithLicense, template));

    expect(result['@type']).toBe(expectedResult['@type']);
    expect(result['@id']).toBe(expectedResult['@id']);
    expect(result['dct:title']).toBe(expectedResult['dct:title']);
    expect(result['dct:description']).toBe(expectedResult['dct:description']);
    expect(result['dcat:contactPoint']).toEqual(
      expectedResult['dcat:contactPoint'],
    );
    expect(result['dct:publisher']).toBe(expectedResult['dct:publisher']);
    expect(result['dcat:theme']).toBe(expectedResult['dcat:theme']);
    expect(result['dct:accessRights']).toBe(expectedResult['dct:accessRights']);
    expect(result['dct:identifier']).toBe(expectedResult['dct:identifier']);
    expect(result['dct:language']).toEqual(expectedResult['dct:language']);
    expect(result['dcat:keyword']).toEqual(expectedResult['dcat:keyword']);
    expect(result['dct:provenance']).toBe(expectedResult['dct:provenance']);
    expect(result['dct:issued']).toBe(expectedResult['dct:issued']);
    expect(result['dcat:distribution']).toBeTruthy();
    expect(result['dct.license']).toBe('a-common-license');
  });

  it('DCAT language node empty if no language', function () {
    const withoutLanguage = { ...dataset, language: null };
    const result = JSON.parse(formatDcatDataset(withoutLanguage, defaultFormatTemplate));

    expect(result['dct:language']).toBe('');
  });

  it('DCAT distributions have correct format', function () {
    const distDataset = {
      ...dataset,
      landingPage: 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/maps/0_0',
      downloadLink: 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/0_0',
      id: '0_0',
      geometryType: 'point',
      supportedExtensions: ['WFSServer', 'WMSServer']
    };
    const expectedResult = {
      html: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl':
          'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/maps/0_0',
        'dct:format': {
          '@id': 'ftype:HTML',
        },
        'dct:description': 'Web Page',
        'dct:title': 'ArcGIS Hub Dataset',
      },
      restAPI: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl':
          'https://sampleserver3.arcgisonline.com/arcgis/rest/services/Earthquakes/RecentEarthquakesRendered/MapServer/0',
        'dct:format': {
          '@id': 'ftype:JSON',
        },
        'dct:description': 'Esri REST',
        'dct:title': 'ArcGIS GeoService',
      },
      geoJSON: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/0_0.geojson',
        'dct:format': {
          '@id': 'ftype:GEOJSON',
        },
        'dct:description': 'GeoJSON',
        'dct:title': 'GeoJSON',
      },
      csv: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/0_0.csv',
        'dct:format': {
          '@id': 'ftype:CSV',
        },
        'dct:description': 'CSV',
        'dct:title': 'CSV',
      },
      wfs: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'https://sampleserver3.arcgisonline.com/arcgis/services/Earthquakes/RecentEarthquakesRendered/MapServer/WFSServer?request=GetCapabilities&service=WFS',
        'dct:format': {
          '@id': 'ftype:WFS_SRVC',
        },
        'dct:description': 'OGC WFS',
        'dct:title': 'OGC WFS',
      },
      kml: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/0_0.kml',
        'dct:format': {
          '@id': 'ftype:KML',
        },
        'dct:description': 'KML',
        'dct:title': 'KML',
      },
      zip: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/0_0.zip',
        'dct:format': {
          '@id': 'ftype:ZIP',
        },
        'dct:description': 'Shapefile',
        'dct:title': 'ZIP',
      },
      wms: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'https://sampleserver3.arcgisonline.com/arcgis/services/Earthquakes/RecentEarthquakesRendered/MapServer/WMSServer?request=GetCapabilities&service=WMS',
        'dct:format': {
          '@id': 'ftype:WMS_SRVC',
        },
        'dct:description': 'OGC WMS',
        'dct:title': 'OGC WMS',
      },
    };
    const result = JSON.parse(formatDcatDataset(distDataset, defaultFormatTemplate));
    expect(result['dcat:distribution'][0]).toEqual(expectedResult.html);
    expect(result['dcat:distribution'][1]).toEqual(expectedResult.restAPI);
    expect(result['dcat:distribution'][2]).toEqual(expectedResult.geoJSON);
    expect(result['dcat:distribution'][3]).toEqual(expectedResult.csv);
    expect(result['dcat:distribution'][4]).toEqual(expectedResult.wfs);
    expect(result['dcat:distribution'][5]).toEqual(expectedResult.kml);
    expect(result['dcat:distribution'][6]).toEqual(expectedResult.zip);
    expect(result['dcat:distribution'][7]).toEqual(expectedResult.wms);
  });

  it('basic DCAT distributions are generated', function () {
    const result = JSON.parse(formatDcatDataset(dataset, defaultFormatTemplate));
    const dist1 = result['dcat:distribution'][0]['dct:title'];
    const dist2 = result['dcat:distribution'][1]['dct:title'];

    expect(dist2).toBeTruthy();
    expect(dist1).toBe('ArcGIS Hub Dataset');
    expect(dist2).toBe('ArcGIS GeoService');
  });

  it('FeatureLayer DCAT distributions are generated', function () {
    const featureLayerDataset = {
      ...dataset,
      id: '0_0',
    };
    const result = JSON.parse(formatDcatDataset(featureLayerDataset, defaultFormatTemplate));
    const dist1 = result['dcat:distribution'][2]['dct:title'];
    const dist2 = result['dcat:distribution'][3]['dct:title'];

    expect(dist2).toBeTruthy();
    expect(dist1).toBe('GeoJSON');
    expect(dist2).toBe('CSV');
  });

  it('FeatureLayer DCAT distributions with available geometryType are generated', function () {
    const featureLayerDataset = {
      ...dataset,
      isFeatureLayer: true,
      hasGeometryType: true,
      id: '0_0',
      geometryType: 'point',
    };
    const result = JSON.parse(formatDcatDataset(featureLayerDataset, defaultFormatTemplate));
    const dist1 = result['dcat:distribution'][4]['dct:title'];
    const dist2 = result['dcat:distribution'][5]['dct:title'];

    expect(dist2).toBeTruthy();
    expect(dist1).toBe('KML');
    expect(dist2).toBe('ZIP');
  });

  it('DCAT distributions include WFS when supported', function () {
    const WFSDataset = { 
      ...dataset,
      supportedExtensions: ['WFSServer']
    };
    const result = JSON.parse(formatDcatDataset(WFSDataset, defaultFormatTemplate));
    const dist = result['dcat:distribution'][2]['dct:title'];

    expect(dist).toBeTruthy();
    expect(dist).toBe('OGC WFS');
  });

  it('DCAT distributions include WMS when supported', function () {
    const WMSDataset = { 
      ...dataset,
      supportedExtensions: ['WMSServer']
    };
    const result = JSON.parse(formatDcatDataset(WMSDataset, defaultFormatTemplate));
    const dist = result['dcat:distribution'][2]['dct:title'];

    expect(dist).toBeTruthy();
    expect(dist).toBe('OGC WMS');
  });

  it('Proxied CSV DCAT distributions are generated', function () {
    const proxiedCSVDataset = {
      ...dataset,
      type: 'CSV',
      size: 1,
      url: null,
    };
    const result = JSON.parse(formatDcatDataset(proxiedCSVDataset, defaultFormatTemplate));
    expect(result['dcat:distribution']).toHaveLength(3);
    expect(result['dcat:distribution'][2]['dct:title']).toBe('CSV');
  });
});