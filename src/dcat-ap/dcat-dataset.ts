import { getUserUrl } from '@esri/arcgis-rest-portal';
import { localeToLang } from './dcat-formatters';
import * as _ from 'lodash';
import { isPage } from '@esri/hub-sites';
import { UserSession } from '@esri/arcgis-rest-auth';

export class DcatDataset {
  //  static requiredPaths = [
  //    'default.id',
  //    'default.url',
  //    'item.owner',
  //    'item.title',
  //    'item.tags',
  //    'item.description',
  //    'item.culture',
  //    'item.created',
  //    'metadata.metadata',
  //    'layer.geometryType',
  //    'server.supportedExtensions'
  //  ];

  private _dto: any;
  private _portalUrl: string;
  private _orgTitle: string;
  private _siteUrl: string;

  constructor (dto: any, portalUrl: string, orgTitle: string, siteUrl: string) {
    this._dto = dto;
    this._portalUrl = portalUrl;
    this._orgTitle = orgTitle;
    this._siteUrl = siteUrl;
  }

  /**
    * Lookup fn
    */
  _get (path) {
    return _.get(this._dto, path, null);
  }

  get id () { return this._get('default.id'); }
  get url () { return this._get('default.url'); }
  get landingPage () { return `${this._siteUrl}/datasets/${this.id}`; }
  get title () { return this._get('item.title'); }
  get description () { return this._get('item.description'); }
  get owner () { return this._get('item.owner'); }
  get ownerUri () {
    return getUserUrl({
      portal: `${this._portalUrl}/sharing/rest`,
      username: this.owner
    } as UserSession) + '?f=json';
  }

  get language () {
    return this._metaLanguage || localeToLang(this._get('item.culture')) || null;
  }

  get keyword () {
    const metaKeyword = this._metaKeyword;
    const tags = this._get('item.tags');

    const hasNoTags = !tags || tags.length === 0 || !tags[0]; // if tags is undefined, the tags array is empty, or tags is an empty string
    if (isPage(this._get('item')) && !metaKeyword && hasNoTags) {
      return ['ArcGIS Hub page'];
    }

    return metaKeyword || tags;
  }

  /**
    * Returns an ISO string
    */
  get issuedDateTime () {
    return this._metaPubDate || new Date(this._get('item.created')).toISOString();
  }

  get isFeatureLayer () { return /_/.test(this.id); }
  get hasGeometryType () { return !!this._get('layer.geometryType'); }
  get _supportedExtensions () { return this._get('server.supportedExtensions'); }
  get supportsWFS () { return this._supportedExtensions && this._supportedExtensions.includes('WFSServer'); }
  get supportsWMS () { return this._supportedExtensions && this._supportedExtensions.includes('WMSServer'); }

  get orgTitle () { return this._orgTitle; }
  get orgContactUrl () { return this._get('org.portalProperties.links.contactUs.url'); }

  /* BEGIN INSPIRE METADATA PROPS (may want to introduce a metadata class to manage formats eventually) */

  get _metaKeyword () { return this._get('metadata.metadata.dataIdInfo.searchKeys.keyword'); }
  get _metaLanguage () { return this._get('metadata.metadata.dataIdInfo.dataLang.languageCode.@_value'); }
  get metaProvenance () { return this._get('metadata.metadata.dataIdInfo.idCredit'); }
  get _metaPubDate () { return this._get('metadata.metadata.dataIdInfo.idCitation.date.pubDate'); }

  /* BEGIN METHODS */

  getDownloadUrl (format) {
    // get spatial reference
    const spatialReference = this._get('server.spatialReference');
    let queryStr = '';
    if (spatialReference) {
      const { latestWkid, wkid } = spatialReference;
      if (wkid) {
        const outSR = JSON.stringify({ latestWkid, wkid });
        queryStr = `?outSR=${encodeURIComponent(outSR)}`;
      }
    }
    return `${this.landingPage}.${format}${queryStr}`;
  }

  getOgcUrl (type = 'WMS') {
    return this.url.replace(/rest\/services/i, 'services').replace(/\d+$/, `${type}Server?request=GetCapabilities&service=${type}`);
  }
}
