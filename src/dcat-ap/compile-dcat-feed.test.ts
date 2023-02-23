import { compileDcatFeedEntry } from './compile-dcat-feed';
import * as datasetFromApi from '../test-helpers/mock-dataset.json';
import { DcatApError } from './dcat-ap-error';

describe('generating DCAT-AP 2.0.1 feed', () => {
  it('should throw 400 DcatAp error if template contains transformer that is not defined', async function () {
    const dcatTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      issued: '{{created:toISO}}'
    }

    try {
      compileDcatFeedEntry(datasetFromApi, dcatTemplate, {});
    } catch (error) {
      expect(error).toBeInstanceOf(DcatApError);
      expect(error).toHaveProperty('statusCode', 500);
    }
  });

  it('show return distribution in a single array', async function () {
    const dcatTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      'dcat:distribution': [
        'distro1',
        'distro2',
        ['distro3', 'distro4']
      ]
    }

    const dcatDataset = JSON.parse(compileDcatFeedEntry(datasetFromApi, dcatTemplate, {}));
    expect(dcatDataset['dcat:distribution']).toBeDefined();
    expect(dcatDataset['dcat:distribution']).toStrictEqual(['distro1', 'distro2', 'distro3', 'distro4']);
  });

  it('show not return uninterpolated distribution in dataset', async function () {
    const dcatTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      'dcat:distribution': ['distro1', '{{distroname}}']
    }
    const dcatDataset = JSON.parse(compileDcatFeedEntry(datasetFromApi, dcatTemplate, {}));
    expect(dcatDataset['dcat:distribution']).toStrictEqual(['distro1']);
  });

  it('should throw error if geojson from provider is missing', async function () {
    const dcatTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      issued: '{{created:toISO}}'
    };

    expect(() => {
      compileDcatFeedEntry(undefined, dcatTemplate, {});
    }).toThrow(DcatApError);

  });

});