import { LightningElement, api, track } from 'lwc';
import countryFormatUtil from '@salesforce/resourceUrl/countryformatutil';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import CecCountryMetadata from 'c/cecCountryMetadata';
//import CEC_Phone_Validation_Message from '@salesforce/label/c.CEC_Phone_Validation_Message';
//import CEC_Phone_Validation_Message2 from '@salesforce/label/c.CEC_Phone_Validation_Message2';

export default class Cecphone extends LightningElement {
    @track suppliedPhone;
    @api required=false;
    @api readonly=false;
    @api disabled=false;
    @api label;
    @api name;
    @api stopFormatting;
    @track countryISOMappingData;
    isPhoneLibraryLoaded = false;
    iti;
    _country;
    _value;
    _errorMessage;

    loadPhoneLibrary(){
        return Promise.all([
            loadScript(this, countryFormatUtil + '/js/utils.js'),
            loadScript(this, countryFormatUtil + '/js/intlTelInput.js'),
            new CecCountryMetadata().init().then(response=>{
                this.countryISOMappingData = response.countryISOMappingData;
                return response;
            }).catch(error => { 
                console.error(error);
                return null;
            }),
        ]);
    }

    renderedCallback() {
        console.log('******* renderedCallback Invoked **************');
        console.log('iti==>',this.iti);
        if(!this.iti&&!this.stopFormatting){
            console.log('initializing the library...');
            var input = this.template.querySelector('.phone-input');
            this.loadPhoneLibrary().then((responses) => {
                this.isPhoneLibraryLoaded = true;
                this.iti = intlTelInput(input, {
                    allowDropdown: false,
                    nationalMode: false,
                    utilsScript: countryFormatUtil + '/js/utils.js',
                });
                if(this.value){
                    this.validatePhoneFormatWithCountry();
                }
            }).catch(error => {
                console.log('FAILED to load country format utility.......',error);
            });
        }
    }

    handleCountryChange(country) {
        if(!this.stopFormatting){
            console.log('*** handleCountryChange country ***',country);
            var phoneinput = this.template.querySelector('.phone-input');
            if(phoneinput){
                console.log('*** handleCountryChange phone ****',phoneinput.value)
                if(country && country!='--None--' && phoneinput.value){
                    phoneinput.setCustomValidity('');
                    phoneinput.reportValidity();
                    this._country=country;
                    this.validatePhoneFormatWithCountry();
                }
            }
        }
    }

    //We are not using the onchange event, because onchange called with each key press.
    handlePhoneBlur(event) {
        this.setCustomValidity('');
        this.reportValidity();
        if(this.stopFormatting){
            this.dispatchEvent(new CustomEvent('phoneformatted', { detail: { value: event.target.value } }));
        }
        //As doing this in report validaty create infinite recursion        
        if(!event.target.value && !this.stopFormatting){
            
            this.dispatchEvent(new CustomEvent('phoneformatted', { detail: { value: event.target.value } }));
        }
    }
    
    validatePhoneFormatWithCountry() {
        if(!this.stopFormatting){
            var input = this.template.querySelector('.phone-input');
            var iti = this.iti;
            if (!iti) {
                return;
            }
            let countryMap = this.countryISOMappingData;
            //some contacts country is not mandatory to be selected. so default it to USA iso code format the phone number
            let countryCode='us';
            let pno = input.value;
            if (pno) {
                //fetch the iso code for the selected country.
                if (this._country) {
                    let selectedCountry = this._country;
                    console.log('selectedCountry===>', selectedCountry);
                    countryCode = countryMap.get(selectedCountry);
                    console.log('countryCode===>', countryCode);
                }
                iti.setCountry(countryCode);
                if (intlTelInputUtils.isValidNumber(pno, countryCode)) {
                    let userIntlPhone = intlTelInputUtils.formatNumber(pno,countryCode,intlTelInputUtils.numberFormat.INTERNATIONAL);
                    console.log('INTL Format phone ===', userIntlPhone);
                    if(input.value!==userIntlPhone||this.value != userIntlPhone){
                        
                        
                        this.value = userIntlPhone;
                        input.value = this.value;
                        //raise an event with formatted phone.
                        this.dispatchEvent(new CustomEvent('phoneformatted', { detail: { value: this.value } }));
                    
                    }
                    input.setCustomValidity('');
                    input.reportValidity();
                } else {
                    console.log('User enter Dial Phone is ** Invalid **', pno);
                    input.value=pno;
                    if(!iti.getSelectedCountryData().iso2){
                        input.setCustomValidity('your phn umber is invalid');
                    }else{
                        input.setCustomValidity('phn no is not correct');    
                    }
                    input.reportValidity();
                }
            } else {
                input.setCustomValidity('');
                input.reportValidity();
            }
        }
    }

    @api
    set country(country) {
        this._country = country;
        Promise.resolve().then(()=>{this.handleCountryChange(country)})
        
    }

    get country(){
        return this._country;    
    }

    @api
    set value(value) {
        console.log('*** cecphone set value called ***',value);
        if(this._value != value){
            this._value = value;
            var input = this.template.querySelector('.phone-input');
            if(input){
                input.value=this._value;
            }
            this.reportValidity();
        }
    }

    get value(){
        return this._value;
    }

    @api reportValidity() {
        var input = this.template.querySelector('.phone-input');
        if(input){
            if(this._errorMessage){
                input.reportValidity();    
            }else{
                input.setCustomValidity('');
                input.reportValidity();
                if(input.value && !this.stopFormatting){
                    this.validatePhoneFormatWithCountry();
                }
            }
        }
    }
    @api checkValidity() {
        return this.template.querySelector('lightning-input').checkValidity();
    }
    @api setCustomValidity(errmsg){
        this._errorMessage=errmsg;
        this.template.querySelector('lightning-input').setCustomValidity(errmsg); 
    }  
}