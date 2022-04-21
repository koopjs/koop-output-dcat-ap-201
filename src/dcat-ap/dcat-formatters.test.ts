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

  describe('distributions', () => {
    const distributions = {
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

    const getDistributions = (dataset: any, template: any) => {
      const formattedDataset = JSON.parse(
        formatDcatDataset(dataset, template)
      );
      return formattedDataset['dcat:distribution'];
    }

    it('All DCAT distributions have correct format', function () {
      const distDataset = {
        ...dataset,
        landingPage: 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/maps/0_0',
        downloadLink: 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/0_0',
        id: '0_0',
        geometryType: 'point',
        supportedExtensions: ['WFSServer', 'WMSServer']
      };
      
      const result = JSON.parse(formatDcatDataset(distDataset, defaultFormatTemplate));
      expect(result['dcat:distribution'][0]).toEqual(distributions.html);
      expect(result['dcat:distribution'][1]).toEqual(distributions.restAPI);
      expect(result['dcat:distribution'][2]).toEqual(distributions.geoJSON);
      expect(result['dcat:distribution'][3]).toEqual(distributions.csv);
      expect(result['dcat:distribution'][4]).toEqual(distributions.wfs);
      expect(result['dcat:distribution'][5]).toEqual(distributions.kml);
      expect(result['dcat:distribution'][6]).toEqual(distributions.zip);
      expect(result['dcat:distribution'][7]).toEqual(distributions.wms);
    });
  
    it('basic DCAT distributions are generated', function () {
      const result = getDistributions(dataset, defaultFormatTemplate);
      expect(result).toHaveLength(2);
      expect(result[0]['dct:title']).toEqual(distributions.html['dct:title']);
      expect(result[1]['dct:title']).toEqual(distributions.restAPI['dct:title']);
    });
  
    it('FeatureLayer DCAT distributions are generated', function () {
      const featureLayerDataset = {
        ...dataset,
        id: '0_0',
      };
      const result = getDistributions(featureLayerDataset, defaultFormatTemplate);
      expect(result).toHaveLength(4);
      expect(result[0]['dct:title']).toEqual(distributions.html['dct:title']);
      expect(result[1]['dct:title']).toEqual(distributions.restAPI['dct:title']);
      expect(result[2]['dct:title']).toEqual(distributions.geoJSON['dct:title']);
      expect(result[3]['dct:title']).toEqual(distributions.csv['dct:title']);
    });
  
    it('FeatureLayer DCAT distributions with available geometryType are generated', function () {
      const featureLayerDataset = {
        ...dataset,
        isFeatureLayer: true,
        hasGeometryType: true,
        id: '0_0',
        geometryType: 'point',
      };
      const result = getDistributions(featureLayerDataset, defaultFormatTemplate);
      expect(result).toHaveLength(6);
      expect(result[0]['dct:title']).toEqual(distributions.html['dct:title']);
      expect(result[1]['dct:title']).toEqual(distributions.restAPI['dct:title']);
      expect(result[2]['dct:title']).toEqual(distributions.geoJSON['dct:title']);
      expect(result[3]['dct:title']).toEqual(distributions.csv['dct:title']);
      expect(result[4]['dct:title']).toEqual(distributions.kml['dct:title']);
      expect(result[5]['dct:title']).toEqual(distributions.zip['dct:title']);
    });
  
    it('DCAT distributions include WFS when supported', function () {
      const WFSDataset = { 
        ...dataset,
        supportedExtensions: ['WFSServer']
      };
      const result = getDistributions(WFSDataset, defaultFormatTemplate);
      expect(result).toHaveLength(3);
      expect(result[0]['dct:title']).toEqual(distributions.html['dct:title']);
      expect(result[1]['dct:title']).toEqual(distributions.restAPI['dct:title']);
      expect(result[2]['dct:title']).toEqual(distributions.wfs['dct:title']);
    });
  
    it('DCAT distributions include WMS when supported', function () {
      const WMSDataset = { 
        ...dataset,
        supportedExtensions: ['WMSServer']
      };
      const result = getDistributions(WMSDataset, defaultFormatTemplate);
      expect(result).toHaveLength(3);
      expect(result[0]['dct:title']).toEqual(distributions.html['dct:title']);
      expect(result[1]['dct:title']).toEqual(distributions.restAPI['dct:title']);
      expect(result[2]['dct:title']).toEqual(distributions.wms['dct:title']);
    });
  
    it('Proxied CSV DCAT distributions are generated', function () {
      const proxiedCSVDataset = {
        ...dataset,
        type: 'CSV',
        size: 1,
        url: null,
      };
      const result = getDistributions(proxiedCSVDataset, defaultFormatTemplate);
      expect(result).toHaveLength(3);
      expect(result[0]['dct:title']).toEqual(distributions.html['dct:title']);
      expect(result[1]['dct:title']).toEqual(distributions.restAPI['dct:title']);
      expect(result[2]['dct:title']).toEqual(distributions.csv['dct:title']);
    });
  
    it('Custom distributions are generated when template contains non-empty array', function () {
      const customDistributionsTemplates = {
        ...defaultFormatTemplate,
        'dcat:distribution': [
          {
            myKey: '{{name}}',
            myConstant: 'constant'
          }
        ]
      };
      const result = getDistributions(dataset, customDistributionsTemplates);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        myKey: 'Jules Goes The Distance',
        myConstant: 'constant'
      });
      expect(result[1]['dct:title']).toEqual(distributions.html['dct:title']);
      expect(result[2]['dct:title']).toEqual(distributions.restAPI['dct:title']);
    });
  
    it('Custom distributions are not generated when template contains empty array', function () {
      const customDistributionsTemplates = {
        ...defaultFormatTemplate,
        'dcat:distribution': [],
      }
      const result = getDistributions(dataset, customDistributionsTemplates);
      expect(result).toHaveLength(2);
      expect(result[0]['dct:title']).toEqual(distributions.html['dct:title']);
      expect(result[1]['dct:title']).toEqual(distributions.restAPI['dct:title']);
    });
  
    it('Custom distributions are not generated when template contains an object', function () {
      const customDistributionsTemplates = {
        ...defaultFormatTemplate,
        'dcat:distribution': {
          myKey: '{{name}}',
          myConstant: 'constant'
        },
      }
      const result = getDistributions(dataset, customDistributionsTemplates);
      expect(result).toHaveLength(2);
      expect(result[0]['dct:title']).toEqual(distributions.html['dct:title']);
      expect(result[1]['dct:title']).toEqual(distributions.restAPI['dct:title']);
    });
  });
});