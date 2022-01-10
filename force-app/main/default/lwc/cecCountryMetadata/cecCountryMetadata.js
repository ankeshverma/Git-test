import getCountryMappingDetails from '@salesforce/apex/DynamicFieldCaseHandler.getCountryMappingDetails';

export default class CecCountryMetadata {
   
    error;
    countryMappingData = new Map();
    countryISOMappingData = new Map();
    ISOToCountryMappingData = new Map();
    countryMappingPicklist=[];
    countryContextMappingData = new Map();
   
    init() {
        
        let promise = new Promise(function (resolve, reject) {
            getCountryMappingDetails().then(result=>{
                //console.log('country meta data result ===',JSON.stringify(result))
                result.forEach(element => {
                    this.countryMappingData.set(element.MasterLabel,element);
                    this.countryISOMappingData.set(element.MasterLabel,element.Country_ISO2Code__c);
                    let isoCode = ((element.Country_ISO2Code__c || '').toUpperCase() || element.MasterLabel);
                    this.countryMappingPicklist.push({label:element.MasterLabel,value:isoCode});
                    this.ISOToCountryMappingData.set(isoCode,element.MasterLabel);
                    if(element.CEC_Country_Context_Mappings__r && element.CEC_Country_Context_Mappings__r.length){
                        this.countryContextMappingData.set(element.MasterLabel,element.CEC_Country_Context_Mappings__r);
                    }
                });
                resolve(this);
            }).catch(error => {
                this.error = error;
                console.log('error====>' + JSON.stringify(this.error));
                reject(error);
            });
        }.bind(this));
        return promise;
    }
}