import { getUserUrl, IItem } from '@esri/arcgis-rest-portal';
import { localeToLang } from './dcat-formatters';
import * as _ from 'lodash';
import { isPage } from '@esri/hub-sites';
import { UserSession } from '@esri/arcgis-rest-auth';
import { IModel, datasetToContent, DatasetResource, getContentSiteUrls, IHubRequestOptions, getProxyUrl, datasetToItem } from '@esri/hub-common';

// Required fields from the API
export const defaultRequiredFields = [
  'id',
  'access', // needed for proxied csv's
  'size', // needed for proxied csv's
  'slug', // needed for landingPage
  'url',
  'owner',
  'name',
  'type',
  'typeKeywords',
  'tags',
  'description',
  'culture',
  'created',
  'metadata',
  'server',
  'geometryType',
  'orgContactEmail'
];

// Fields calculated from API Values
export const defaultCalculatedFields = [
  'landingPage',
  'ownerUri',
  'language',
  'keyword',
  'issuedDateTime',
  'orgTitle',
  'provenance'
];

export function getDcatDataset(hubDataset: any, orgBaseUrl: string, orgTitle: string, siteUrl: string, siteModel: IModel) {
  const content = datasetToContent({ 
    id: hubDataset.id, 
    attributes: hubDataset
  } as DatasetResource);
  const { relative: relativePath } = getContentSiteUrls(content, siteModel);
  const landingPage = siteUrl.startsWith('https://') ? siteUrl + relativePath : `https://${siteUrl}${relativePath}`;
  
  return Object.assign({}, hubDataset, {
    landingPage,
    ownerUri: getUserUrl({
        portal: `${orgBaseUrl}/sharing/rest`,
        username: hubDataset.owner
      } as UserSession) + '?f=json',
    language: _.get(hubDataset, 'metadata.metadata.dataIdInfo.dataLang.languageCode.@_value') || localeToLang(hubDataset.culture) || '',
    keyword: getDatasetKeyword(hubDataset),
    issuedDateTime: _.get(hubDataset, 'metadata.metadata.dataIdInfo.idCitation.date.pubDate') || new Date(hubDataset.created).toISOString(),
    orgTitle,
    provenance: _.get(hubDataset, 'metadata.metadata.dataIdInfo.idCredit', ''),
  });
}

function getDatasetKeyword(dataset: any) {
    const metaKeyword = _.get(dataset, 'metadata.metadata.dataIdInfo.searchKeys.keyword');
    
    if (metaKeyword) {
      return metaKeyword;
    }

    const { tags, type, typeKeywords } = dataset;
    const hasNoTags = !tags || tags.length === 0 || !tags[0]; // if tags is undefined, the tags array is empty, or tags is an empty string
    
    if (isPage({ type, typeKeywords } as IItem) && hasNoTags) {
      return ['ArcGIS Hub page'];
    }

    return tags;
}

// TODO: Should we test these individually?
export const isFeatureLayer = (dcatDataset: any) => /_/.test(dcatDataset.id);
export const isProxiedCSV = (dcatDataset: any) => {
  const requestOptions: IHubRequestOptions = { isPortal: false };
  const item = datasetToItem({ 
    id: dcatDataset.id, 
    attributes: dcatDataset
  } as DatasetResource);
  return !!getProxyUrl(item, requestOptions);
};
export const hasGeometryType = (dcatDataset: any) => !!dcatDataset.geometryType;
export const supportsWFS = (dcatDataset: any) => _.get(dcatDataset, 'supportedExtensions', []).includes('WFSServer');
export const supportsWMS = (dcatDataset: any) => _.get(dcatDataset, 'supportedExtensions', []).includes(('WMSServer'));
export const getDownloadUrl = (dcatDataset: any, format: 'geojson'|'kml'|'csv'|'zip') => {
  const spatialReference = _.get(dcatDataset, 'server.spatialReference');
  let queryStr = '';
  if (spatialReference) {
    const { latestWkid, wkid } = spatialReference;
    if (wkid) {
      const outSR = JSON.stringify({ latestWkid, wkid });
      queryStr = `?outSR=${encodeURIComponent(outSR)}`;
    }
  }
  return `${dcatDataset.landingPage}.${format}${queryStr}`;
};
export const getOgcUrl = (dcatDataset: any, type: 'WMS'|'WFS' = 'WMS') => dcatDataset.url.replace(/rest\/services/i, 'services').replace(/\d+$/, `${type}Server?request=GetCapabilities&service=${type}`);
