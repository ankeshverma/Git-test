import { LightningElement, wire, track, api } from 'lwc';

import CecCountryMetadata from 'c/cecCountryMetadata';
// import postalCodeValidationLabel from '@salesforce/label/c.CEC_Address_PostalCode_Validation';
// import cityValidationLabel from '@salesforce/label/c.CEC_Address_City_Validation';
// import countryValidationLabel from '@salesforce/label/c.CEC_Address_Country_Validation';
// import streetValidationLabel from '@salesforce/label/c.CEC_Address_Street_Validation';
// import provinceValidationLabel from '@salesforce/label/c.CEC_Address_Province_Validation';
// import googleaddresssearchLabel from '@salesforce/label/c.CEC_Google_Address_Search';

import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import SHIPPINGCOUNTRY_FIELD from '@salesforce/schema/Account.ShippingCountryCode';
import SHIPPINGSTATE_FIELD from '@salesforce/schema/Account.ShippingStateCode';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';


import getExceptionalCountryMappingDetails from '@salesforce/apex/DynamicFieldCaseHandler.getExceptionalCountryMappingDetails';

export default class CecAddress extends LightningElement {

    @api required=false;
    @track calculatedRequired = false;
    @api variant;
    @api addressLookupPlaceholder = 'search';
    @api name;
    @api addressLabel;
    @api streetLabel;
    @api cityLabel;
    @api context;

    _CountryLabel
    @api set countryLabel(value){

        this._CountryLabel=value;
    }

    get countryLabel(){
        return (this.requiredCountry||this.calculatedRequired?'*':'')+this._CountryLabel
        //return this._CountryLabel
    }
    @api stateLabel;
    @api postalCodeLabel;
    _country;
    countryIsoCode;

    _provinceCode
    @api
    set provinceCode(value){
        if(this._provinceCode!=value){
            this._provinceCode=value
            this.setProvinceFromProvinceCode()
        }
    }

    get provinceCode(){
        return this._provinceCode
    }

    _street;
    @api
    set street(street){
        if(this._street != street){
            this._street = street;
            this.countryContextValidation();
            this.reportValidity();
        }
    }
    get street(){
        return this._street;
    }

    _city;
    @api
    set city(city){
        if(this._city != city){
            this._city=city;
            this.countryContextValidation();
            this.reportValidity();
        }
    }
    get city(){
        return this._city;
    }

    _postalCode;
    @api 
    set postalCode(postalCode){
        if(this._postalCode != postalCode){
            this._postalCode = postalCode;
            this.countryContextValidation();
            this.reportValidity();
        }
    }
    get postalCode(){
        return this._postalCode;
    }

    @api requiredCountry=false;
    @api disabled=false;

    @api
    set country(country){
        if(this._country != country){
            console.log('*** country setter invoked ***',country);
            this._country = country;
            this.setCountryIsoCode();
        }
    }

    get country(){
        return this._country;
    }

    _province;

    @api
    set province(province){
        if(this._province != province){
            console.log('*** province setter invoked ***',province);
            this._province = province;
            this.setProvinceCode();
        }
    }

    get province(){
        return this._province ;   
    }
    
    
    styleContainer;
    styleContentRequired;

    renderedCallback() {
        if(!this.styleContainer){
            var style = document.createElement('style');
            this.template.querySelector('lightning-input-address').appendChild(style);
            this.styleContainer = style;
        }
        if(!this.countryContextRecord && this.styleContainer){
            this.styleContainer.innerHTML = '';
        }else if(this.countryContextRecord){
            var cityStyle ='';
            var streetStyle ='';
            var postalCodeStyle ='';
            var stateStyle ='';
            var countryStyle ='';
            
            if(this.countryContextRecord.CEC_City__c){
                cityStyle =`
                .address-input [data-field="city"] label.slds-form-element__label::before {
                    content: "*";
                    color: darkred;
                    padding-right: 0.2rem;
                }    
                `;
            }
            if(this.countryContextRecord.CEC_Street__c){
                streetStyle =`
                .address-input [data-field="street"] label.slds-form-element__label::before {
                    content: "*";
                    color: darkred;
                    padding-right: 0.2rem;
                }    
                `;
            }
            if(this.countryContextRecord.CEC_PostalCode__c){
                postalCodeStyle =`
                .address-input [data-field="postalCode"] label.slds-form-element__label::before {
                    content: "*";
                    color: darkred;
                    padding-right: 0.2rem;
                }    
                `;
            }
            if(this.countryContextRecord.CEC_State__c){
                stateStyle =`
                .address-input [data-field="province"] label.slds-form-element__label::before {
                    content: "*";
                    color: darkred;
                    padding-right: 0.2rem;
                }    
                `;
            }
            this.styleContainer.innerHTML = countryStyle + cityStyle + streetStyle + postalCodeStyle + stateStyle;
        }
    }


    removeRequiredStyles() {

    }

    countryMappingData = new Map();
    @track countryMappingPicklist = [];
    @track shippingCountryMappingPicklist = [];//new
    ISOToCountryMappingData = new  Map();
    countryISOMappingData = new Map();
    countryContextMappingData = new Map();

    isloadedCountrydata= false;
    isWireLoaded = false;
    _errorMessage;

    @track dependentValues;
    @track totalDependentValues;
    @track controlValues;
    shippingStatesMap = new Map();
    error;

    exceptionalCountryMappingDetails
    @wire(getExceptionalCountryMappingDetails)
    getExceptionalCountryMappingDetailsWire({error, data}) {
        if(data) {
            this.error = null;
            this.exceptionalCountryMappingDetails=data
            this.processCountryStateMetadata()
        }
        else if(error) {
            this.error = JSON.stringify(error);
        }
    }

    // Account object info
    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    acctObjectInfo;

    picklistValuesByRecordType;
    // Picklist values based on record type
    @wire(getPicklistValuesByRecordType, { objectApiName: ACCOUNT_OBJECT, recordTypeId: '$acctObjectInfo.data.defaultRecordTypeId'})
    countryPicklistValues({error, data}) {
        if(data) {
            this.error = null;
            this.picklistValuesByRecordType=data
            this.processCountryStateMetadata()
        }
        else if(error) {
            this.error = JSON.stringify(error);
        }
    }

    connectedCallback() {
        if(!this.isloadedCountrydata){
            this.loadCountryData();
        }
    }

    processCountryStateMetadata(){
        if(this.exceptionalCountryMappingDetails && this.picklistValuesByRecordType){
            // let countyOptions = [{label:'--None--', value:'--None--'}];
            this.shippingCountryMappingPicklist = this.picklistValuesByRecordType.picklistFieldValues[SHIPPINGCOUNTRY_FIELD.fieldApiName].values;
            // Manually fix shippingCountryMappingPicklist for known  integration value issues
            this.fixedShippingCountryMappingPicklist = new Array() ;
            for (var i=0;i<this.shippingCountryMappingPicklist.length;i++) {
                var obj = {label:this.shippingCountryMappingPicklist[i].label,value:this.shippingCountryMappingPicklist[i].value};
                if (this.exceptionalCountryMappingDetails[obj.label]) {
                    obj.label = this.exceptionalCountryMappingDetails[obj.label].CEC_Country_ExceptionalLabel__c;
                }
                this.fixedShippingCountryMappingPicklist.push(obj) ;
            }
            this.countryISOMappingData=this.fixedShippingCountryMappingPicklist.reduce((mapobject,country)=>{
                mapobject.set(country.label,country.value)
                return mapobject
            },new Map());
            this.ISOToCountryMappingData=this.fixedShippingCountryMappingPicklist.reduce((mapobject,country)=>{
                mapobject.set(country.value,country.label)
                return mapobject
            },new Map());

            let stateOptions = [];//[{label:'--None--', value:'--None--'}];
             // Account State Control Field Picklist values
            this.controlValues = this.picklistValuesByRecordType.picklistFieldValues[SHIPPINGSTATE_FIELD.fieldApiName].controllerValues;
            // Account State dependent Field Picklist values
            this.totalDependentValues = this.picklistValuesByRecordType.picklistFieldValues[SHIPPINGSTATE_FIELD.fieldApiName].values;

            this.totalDependentValues.forEach(key => {
                stateOptions.push({
                    label : key.label,
                    value: key.value
                })
                this.shippingStatesMap.set(key.value,key.label);
            });

            this.dependentValues =  stateOptions.length?stateOptions:[{label:'None',value:'None'}];

            console.log('codes input value ****',this.provinceCode,this.countryIsoCode);

            this.isWireLoaded=true
            if(this.country){
                this.setCountryIsoCode()
            }
            this.updateStateMapBasedOnCountry();
            if(this.province){
                this.setProvinceCode()
            }
            if(this.country||this.province||this.city||this.street||this.postalCode){
                this.processChangeCallback()
            }
        }
    }

    async loadCountryData() {
        try{
            let response = await new CecCountryMetadata().init();
            this.isloadedCountrydata = true;
            this.countryMappingPicklist = response.countryMappingPicklist;
            this.countryMappingData = response.countryMappingData;
            this.countryContextMappingData = response.countryContextMappingData;

            console.log('country data loaded successfully ********************');
            this.countryContextValidation();
            if(this.country||this.province||this.city||this.street||this.postalCode){
                this.reportValidity();
            }
        }catch(error){
            console.error(error);
        }
    }

    handleChange(event) {
        event.stopPropagation();
        this.countryIsoCode = event.detail.country;
        this.provinceCode = event.detail.province;
        this._street = event.detail.street;
        this._city = event.detail.city;
        this._postalCode = event.detail.postalCode;
        this.processChangeCallback();
    }

    handleBlur(){
        this.countryContextValidation();
        this.reportValidity()
        this.dispatchEvent(new CustomEvent('blur'))
    }

    processChangeCallback(){
        if(this.isWireLoaded){
            console.log('called processChangeCallback**********');
            this.updateStateMapBasedOnCountry();
            this.updateStatepicklistBasedOnCountry();
            
            this.country = this.ISOToCountryMappingData.get(this.countryIsoCode);
            this.province= this._stateCodeToSateMap.get(this.provinceCode);
            this.countryContextValidation();
            this.reportValidity();
            this.dispatchEvent(new CustomEvent('change', {detail:{
                country:this.country,
                street:this.street,
                city:this.city,
                postalCode:this.postalCode,
                province:this.province,
                countryIsoCode:this.countryIsoCode,
                provinceCode:this.province?this.provinceCode:null,
                state:this.province,
                stateCode:this.province?this.provinceCode:null,
            }}));
        }
    }

    setCountryIsoCode(){
        console.log('country before load========',this.country);
        if(this.isWireLoaded){
            if(this.country){
                this.countryIsoCode = (this.countryISOMappingData.get(this.country)).toUpperCase();
                console.log('Country==',this.country,'==ISO Code===',this.countryIsoCode);
                this.updateStateMapBasedOnCountry();
                this.updateStatepicklistBasedOnCountry();
                if(this.province){
                    this.setProvinceCode()
                }
                this.countryContextValidation();
                this.reportValidity();
            }else{
                this.countryIsoCode=null
            }
        }
    }

    setProvinceCode(){
        console.log('province after load========',this.province);
        if(this.isWireLoaded){
            if(this.province){
                console.log('province map data is =======>',this._stateToSateCodeMap);
                this.provinceCode = (this._stateToSateCodeMap.get(this.province));
                console.log('province==',this.province,'== Code===',this.provinceCode);
                this.countryContextValidation();
                this.reportValidity();
            }else{
                //this.provinceCode=null
                if(this.dependentValues && this.dependentValues.filter(v=>v.value!='None').length==0){
                    this.provinceCode='None';
                }
            }
        }
    }

    setProvinceFromProvinceCode(){
        if(this.isWireLoaded){
            if(this.provinceCode && this._stateCodeToSateMap){
                if(this._stateCodeToSateMap.get(this.provinceCode)){
                    this.province= this._stateCodeToSateMap.get(this.provinceCode);
                }
            }
        }
    }

    _stateCodeToSateMap=new Map() ;
    _stateToSateCodeMap=new Map() ;
    updateStateMapBasedOnCountry(){
        this._stateCodeToSateMap = new Map();
        this._stateToSateCodeMap = new Map();
        // filter the total dependent values based on selected country value 
        this.totalDependentValues.forEach(conValues => {
            if(conValues.validFor[0] === this.controlValues[this.countryIsoCode]) {
                this._stateCodeToSateMap.set(conValues.value,conValues.label);
                this._stateToSateCodeMap.set(conValues.label,conValues.value)
            }
        })
        console.log('state map',this._stateCodeToSateMap,this.totalDependentValues)
    }
    updateStatepicklistBasedOnCountry(){
        let dependValues = [];
        if(this.countryIsoCode === 'UNKNOWN' || !this.countryIsoCode) {
            dependValues = [];
        }
        // filter the total dependent values based on selected country value 
        this.totalDependentValues.forEach(conValues => {
            if(conValues.validFor[0] === this.controlValues[this.countryIsoCode]) {
                dependValues.push({
                    label: conValues.label,
                    value: conValues.value
                })
            }
        })
        this.dependentValues = dependValues.length?dependValues:[{label:'None',value:'None'}];
        this.provinceFix()
    }

    provinceFix(){
        setTimeout(() => {
            console.log(this.provinceCode)
            const address = this.template.querySelector('lightning-input-address');

            Object.assign(address, {
                province: this.provinceCode,
                provinceOptions: this.dependentValues
            })
        }, 100);
    }

    @api setCustomValidityForField(message,fieldName) {
        this._errorMessage=message;
        const address =  this.template.querySelector('lightning-input-address');
        if(address){
            address.setCustomValidityForField(message,fieldName);
        }
    }

    @api setCustomValidity(errmsg){
        this._errorMessage=errmsg;
        this.setCustomValidityForField(this._errorMessage,'city'); 
        this.setCustomValidityForField(this._errorMessage,'postalCode');
        this.setCustomValidityForField(this._errorMessage,'street');
        this.setCustomValidityForField(this._errorMessage,'country');
        this.setCustomValidityForField(this._errorMessage,'province'); //newly
    }

    countryContextRecord;
    countryContextValidation(){
        if (this.isloadedCountrydata) {
            if(this.countryContextMappingData.get(this.country)){
                this.countryContextRecord = this.countryContextMappingData.get(this.country).find(obj => {
                    return obj.CEC_Context__c == this.context;
                });
                console.log('countryContextRecord=====',JSON.stringify(this.countryContextRecord))
            }else{
                this.countryContextRecord = undefined;    
            }
            console.log('Context====',this.context,'country=====',this.country);
            if(this.context && this.country){//newly PBI-3288628,PBI-3288439
                if(this.countryContextRecord){
                    this.requiredCountry = true;
                    this.calculatedRequired = false;
                }else{
                    if(this.required){
                        this.calculatedRequired = true;    
                    }else{
                        this.calculatedRequired = false;    
                    }
                }
            }else{
                this.calculatedRequired = this.required;
            }
        }
    }

    @api reportValidity() {
        if (this.isloadedCountrydata) {
            console.log('*** reportValidity invoked ***');
            const address = this.template.querySelector('lightning-input-address');

            /*var countryContextRecord;
            if(this.countryContextMappingData.get(this.country)){
                countryContextRecord = this.countryContextMappingData.get(this.country).find(obj => {
                    return obj.CEC_Context__c == this.context;
                });
                console.log('countryContextRecord=====',JSON.stringify(countryContextRecord))
            }
            if(this.context && this.country){//newly PBI-3288628,PBI-3288439
                if(countryContextRecord){
                    this.required = false;
                }else{
                    this.required = true;    
                }
            }*/

            if(this._errorMessage && address){
                address.reportValidity();    
            }else 
            if (this.country) {
                address.setCustomValidityForField('', 'country');
                const countrydata = this.countryMappingData.get(this.country);
                if (countrydata) {
                    //console.log('countrydata**********', JSON.stringify(countrydata));
                    const isCityRequired = countrydata.City__c;
                    const isPostalCodeRequired = countrydata.Postal_Code__c;
                    if (isCityRequired && !this.city) {
                        address.setCustomValidityForField(`not valid ${this.country}`, 'city');
                    } else {
                        address.setCustomValidityForField('', 'city');
                    }
                    if (isPostalCodeRequired && !this.postalCode) {
                     //   address.setCustomValidityForField(`${postalCodeValidationLabel} ${this.country}`, 'postalCode');
                     address.setCustomValidityForField(`Not valid ${this.country}`, 'postalCode');
                    } else {
                        address.setCustomValidityForField('', 'postalCode');
                    }
                    //newly
                    if(this.countryContextRecord && this.countryContextRecord.CEC_Street__c && !this.street){
                        address.setCustomValidityForField(`Not valid ${this.country}`, 'street');
                    }else{
                        address.setCustomValidityForField('', 'street');    
                    }
                    if(this.countryContextRecord && this.countryContextRecord.CEC_State__c && !this.provinceCode){
                        address.setCustomValidityForField(`not valid ${this.country}`, 'province');
                    }else{
                        address.setCustomValidityForField('', 'province');    
                    }
                }
                console.log('1')
                address.reportValidity();
            } else {
                if(this.calculatedRequired || this.requiredCountry){
                    console.log('2')
                    this.setCustomValidity('');
                    address.setCustomValidityForField(countryValidationLabel, 'country');
                    address.reportValidity();
                }
            }
            setTimeout(() => {
                address.reportValidity();    
            }, 1);
        }
    }
    
    @api checkValidity() {
        const address =  this.template.querySelector('lightning-input-address');
        if(address){
            // if(address.validity.valueMissing && !address.validity.customError){
            //     if(this.country && this.city && this.street && this.postalCode){
            //         if(this.dependentValues && this.dependentValues.length==0){
            //             return true;
            //         }
            //     }
            // }
            return address.checkValidity();
        }
        return true;
    }

    

}