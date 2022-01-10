import { LightningElement,api ,track, wire } from 'lwc';
import cecLightningInput from './cecLightningInputTemplate.html';
import cecLightningFormattedText from './cecLightningInputFormattedTextTemplate.html';
import cecToggleTemplate from './cecToggleTemplate.html';
import cecLightningCombobox from './cecLightningComboboxTemplate.html';
import cecAddress from './cecAddressTemplate.html';
import cecAddressNewOptionalTemplate from './cecAddressNewOptionalTemplate.html';
import cecphone from './cecphoneTemplate.html';
import cecEmail from './cecEmailTemplate.html';
import ceclookup from './cecLookupTemplate.html';
import cecOverideLabelLightningInputTemplate from './cecOverideLabelLightningInputTemplate.html';

export default class CecField extends LightningElement {
    @api
    set field(field) {
        this._field = field
        console.log('fieldfield', field);
        if (field.controlledBy && !this.controlledBy) {
            this.controlledBy = { ...field.controlledBy }
            this.controlledByAttirbute = { ...field.controlledBy.attribute }
            this.initialValue = { ...this.field.value }
        }
        if (this.field.attribute && this.field.attribute.options) {
            this.defaultOptions = this.field.attribute.options;


        }
    }
    get field() {
        return this._field
    }
    _field

    @track
    initialValue

    @track
    controlledBy

    @track
    controlledByAttirbute


    @api
    label

    @api
    objectApiName

    @api
    formData

    isChecked = false;

    constructor() {
        super()

    }

    //Set up template based on template renderer
    render() {

        switch (this.field.template) {
            case 'cec-address':

                return cecAddress;
            case 'cec-address-optional':

                return cecAddressNewOptionalTemplate;

            case 'cecphone':

                return cecphone;
            case 'cec-email':

                return cecEmail;

            case 'lightning-combobox':

                return cecLightningCombobox;

            case 'lightning-formatted-text':

                return cecLightningFormattedText;

            case 'cec-toggle':

                return cecToggleTemplate;

            case 'cec-lookup':

                return ceclookup;
            case 'cec-multi-select-lookup':

                // return cecMultiSelectLookupTemplate;
                return cecMultilookUpWithDatatable;
            case 'cec-multi':
                return cecMultiSelectLookupTemplate;

            case 'cec-overide-label-template':
                //     console.log('helo',this.field.template+'---name---',this.field.Name,this.field.objectApiName);
                return cecOverideLabelLightningInputTemplate;

            default:
                return cecLightningInput;
        }
    }

    connectedCallback() {
        //Adding Change event listener from slotted elements 
        //Should be this.addEventListener not sure how its workign
        this.template.addEventListener('change', this.handleChangeEventFromSlot)
    }

    renderedCallback() {
        //Removed after converting  lightning-rich-text-toolbar-button to lightning-button
        //var richText=this.template.querySelector('lightning-input-rich-text');
        // if(richText){
        //     //Used by Lightning formatted text template for toolbar buttons
        //     var label=getComputedStyle(richText).getPropertyValue('--cec-field-controlled-by-label')
        //     //Convert string double quoted string
        //     richText.style.setProperty('--cec-field-controlled-by-label', JSON.stringify(this.field.controlledBy.label))

        // }
        let cField12 = [...this.querySelectorAll('lightning-input-field')];
        if (cField12) {
            cField12.forEach(e => {
                if (this.field.variant) {
                    let style = document.createElement('style');
                    style.innerText = '.' + e.fieldName + ` lightning-helptext{
                                display:none;
                                    } `;
                    e.appendChild(style)
                    e.classList.add(e.fieldName)
                }

            })
        }
        this.setOverrideStyles()


    }

    isOverrideDone = false
    setOverrideStyles() {
        try {

            //Used by Lightning formatted text template for toolbar buttons
            var targetRootElement = this.template.querySelector('lightning-rich-text-toolbar-button-group lightning-button')

            if (!this.isOverrideDone && targetRootElement) {
                let style = document.createElement('style');
                style.innerText = `
                lightning-rich-text-toolbar-button-group lightning-button lightning-primitive-icon{
                    display:flex
                }            
                `;
                targetRootElement.appendChild(style);
                this.isOverrideDone = true
            }
        } catch (e) {
            console.error(e)
        }
    }

    disconnectedCallback() {
        //Removing Change event listener from slotted elements 
        this.template.removeEventListener('change', this.handleChangeEventFromSlot)
    }
    // handlfcs(){
    //     console.log('in fcs');
    //     this.template.querySelector('c-ceclookup').setDefaultResults(this.defaultOptions);
    // }

    //Handle and modify change event to replicate lighting input field change events
    handleChangeEventFromSlot = (event) => {
        event.stopPropagation()
        //temprory fix as cec phone send phone formatted instead of change event
        if (this.field.template == 'cecphone') {
            return
        }
        const selectedEvent = new CustomEvent("change", {
            detail: { value: event.detail.value, displayValue: event.detail.value }
        });
        this.dispatchEvent(selectedEvent);
    }



    //Used By lightning-combobox template
    handleValueSelect(event) {
        event.stopPropagation()
        const selectedEvent = new CustomEvent("change", {
            detail: { value: event.detail.value, displayValue: event.detail.value, fieldApiName: event.target.dataset.fieldApiName }
        });
        this.dispatchEvent(selectedEvent);
    }

    //Used By cec-toggle template
    handleToggle(event) {
        event.stopPropagation()
        const selectedEvent = new CustomEvent("change", {
            detail: { value: event.target.checked, displayValue: event.detail.value, fieldApiName: event.target.dataset.fieldApiName }
        });
        this.dispatchEvent(selectedEvent);
    }



    //Used By cec-phone template
    handlePhoneFormatted(event) {
        event.stopPropagation()
        const selectedEvent = new CustomEvent("change", {
            detail: { value: event.detail.value, displayValue: event.detail.value, fieldApiName: this.field.Name }
        });
        this.dispatchEvent(selectedEvent);

    }
    //Used By cec-email template
    handleEmailValueChange(event) {
        event.stopPropagation()
        const selectedEvent = new CustomEvent("change", {
            detail: { value: event.detail.value, displayValue: event.detail.value, fieldApiName: this.field.Name }
        });
        this.dispatchEvent(selectedEvent);

    }
   
    //Used by cec-lookup template -Start
    handleSearch(event) {
        apexSearch(event.detail)
            .then((results) => {
                this.template.querySelector('c-ceclookup').setSearchResults(results);
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error('Lookup error', JSON.stringify(error));
                this.template.querySelector('c-ceclookup').setCustomValidity(error);
            });
    }
    handleMultiSearch(event) {
        console.log('multuSeleccss', this.field.attribute.options);
        let opts = [];
        this.field.attribute.options.forEach(x => {
            let Option = { 'icon': 'standard:groups', 'id': x.value, 'sObjectType': '', 'subtitle': '', 'title': x.label };
            opts = [...opts, Option]
        });
        // let target = this.template.querySelector('c-ceclookup').getSelection();
        // opts = opts.filter(x => !(target || []).map(f => f.id).includes(x.id))


        this.template.querySelector('c-ceclookup').setSearchResults(opts);
        // this.template.querySelector('c-ceclookup').setDefaultResults(opts);
    }


    handleSelectionchange(event) {
        event.stopPropagation()
        const selectedEvent = new CustomEvent("change", {
            detail: { value: event.detail, displayValue: event.detail ? event.detail.title : null }
        });
        this.dispatchEvent(selectedEvent);


    }  
}