import { LightningElement, track, api, wire } from 'lwc';
import ID_FIELD from '@salesforce/schema/Case.Id';
import CASENUMBER_FIELD from '@salesforce/schema/Case.CaseNumber';
import CASESTATUS_FIELD from '@salesforce/schema/Case.Status';
import CASEPRODUCT_FIELD from '@salesforce/schema/Case.Product__c';
import CASE_OBJECT from '@salesforce/schema/Case';
import CASE_SUPPLEMENTARY_OBJECT from '@salesforce/schema/CEC_Case_Supplementary_Data__c';
import { toCamel, getLabel, getFieldValue, getFieldLabel, processTemplate, getObjectInfoByApiName } from "./FormUtility"
import { getRecord, updateRecord, generateRecordInputForUpdate, getRecordNotifyChange, generateRecordInputForCreate } from 'lightning/uiRecordApi';
import getSupplementaryFieldsFromRouting from '@salesforce/apex/DynamicFieldCaseHandler.getSupplementaryFieldsFromRouting';
import { getObjectInfos, getPicklistValues, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';

import { form } from "./createDynamicFieldForm"

export default class CreateDynamicField extends LightningElement {


    @track caseRecord;
    @api recordId;
    @track
    caseRcrd = {}
    dynamicLayout = '[]';
    suppData
    @track
    arInstructionRecord = {}

    get isAllWireLoaded() {
        if (this.caseRecord && this.caseRecord.data
            && this.objectInfo && this.objectInfo.data) {
            return true
        } else {
            return false
        }
    }
    @wire(getRecord, { recordId: '$recordId', fields: '$fields' })
    caseRecordWire({ data, error }) {
        this.caseRecord = { data, error }
        if (error) {

            //  to work on
            // this.error = getErrorMessagesString(error)
            // const errorEvent = new CustomEvent("error", {
            //     detail: this.error
            // });
            // this.dispatchEvent(errorEvent);
        }
        // if (this.loaded) {
        //     this.loaded = false
        //     this.isArCaseRoutableResultfetched = false;
        //     this.fetchIsArCaseRoutableResult()
        // }
        //  this.setupRecordForSave()

    }
    objectInfo
    @wire(getObjectInfos, { objectApiNames: [CASE_OBJECT, CONTACT_OBJECT, CASE_SUPPLEMENTARY_OBJECT] })
    objectInfoWire({ data, error }) {
        this.objectInfo = { data, error }
        // if (error) {
        //     this.error = getErrorMessagesString(error)
        //     const errorEvent = new CustomEvent("error", {
        //         detail: this.error
        //     });
        //     this.dispatchEvent(errorEvent);
        // }
        //  this.setupRecordForSave()
        //  this.setupCaseRouting();
    }

    setupCaseRouting() {
        if (this.isAllWireLoaded) {
            this.caseRcrd = Object.assign({}, this.caseRecord.data.fields)
            getSupplementaryFieldsFromRouting({
                cntry: this.caseRcrd.Country__c.value,
                bUnit: this.caseRcrd.Business_Unit__c.value
            }).then(response => {
                console.log('rseult new', result);
                this.getSupplimentryDataForPrePopulations(result);
                this.dynamicLayout = result;
                setTimeout(() => {
                    this.newForm = this.injectDynamicARCaseInst(form.editMode);
                }, 100);
            }).catch(error => {
                console.log(error);
            })
        }

    }
    getSupplimentryDataForPrePopulations(result) {
        let fields = result ? result.dynamicFields.map(x => x.Name) : ['Summary_Details__c'];
        // let fields = result.dynamicFields.map(x => x.Name);
        getSupplementaryData({
            recordId: this.recordId,
            fields: fields
        }).then(result1 => {
            this.suppData = result1;
            for (const key in result1) {
                if (result) {
                    let fieldInfo = result.dynamicFields.find(x => x.Name == key);
                    if (fieldInfo && fieldInfo.Name && fieldInfo.template) {
                        this.storeValues((fieldInfo), result1[key]);
                    }
                    else if (key == 'CEC_Supply_Order_Data__c') {
                        let ar = [];
                        JSON.parse(result1[key]).forEach(x => {
                            let rows = { icon: 'standard:groups', id: x.id, sObjectType: '', subtitle: '', title: x.id, titleFormatted: x.id, quantity: x.quantity }
                            ar = [...ar, rows]
                        })
                        if (ar.length > 0) {
                            this.showQuantity1 = true;
                        }
                        this.optionSelected = [...ar];
                        this.draftValue = JSON.parse(result1[key]);
                    }
                    else {
                        this.arInstructionRecord[key] = { value: result1[key], displayValue: result1[key] }
                    }
                }
               
            }
        }).catch(error => {
            console.log(error);
        })
    }
    storeValues(fieldInfo, fieldvalues) {
        let ar = [];
        console.log('fullInfo', fieldInfo, fieldvalues)
        switch (fieldInfo.template) {
            case 'cec-toggle':
                this.arInstructionRecord[fieldInfo.Name] = { value: fieldvalues, displayValue: fieldvalues }
                break;
            case 'cec-supply-order':
                fieldvalues.split(';').forEach(x => {
                    let iconSet = { icon: 'standard:groups', id: x, sObjectType: '', subtitle: '', title: x, titleFormatted: x }
                    ar = [...ar, iconSet]
                    this.arInstructionRecord[fieldInfo.Name] = { value: ar, displayValue: ar }
                })
                break;
            case 'cec-multi-select-lookup':
                fieldvalues.split(';').forEach(x => {
                    let iconSet = { icon: 'standard:groups', id: x, sObjectType: '', subtitle: '', title: x, titleFormatted: x }
                    ar = [...ar, iconSet]
                    this.arInstructionRecord[fieldInfo.Name] = { value: ar, displayValue: ar }
                })
                break;
            default:
                this.arInstructionRecord[fieldInfo.Name] = { value: fieldvalues, displayValue: fieldvalues }
                break;
        }

    }
    @track columnsToShowInDataTable = ['identityType', 'value'];
    @track IdentierType = [];
    injectDynamicARCaseInst(forms) {
        if (forms.fields ) {
            let newJSON = [{
                id: '',
                Name: 'Case Supplement',
                objectApiName: 'CEC_Case_Supplementary_Data__c',
                defaultValueId: '',
                fields: this.dynamicLayout ? [...this.dynamicLayout.dynamicFields].filter(x => x.Name) : [{ Name: 'Summary_Details__c', size: 12, template: 'lightning-formatted-text', controlledBy: { type: "checbox", action: "copy-case-description", label: "CEC_Case_AR_Copy_Description", attribute: { checked: false } } }]
            }];
            if (this.dynamicLayout && this.dynamicLayout.dynamicFields != null && this.dynamicLayout.dynamicFields) {
                console.log('dynamiccss', this.dynamicLayout.dynamicFields);
                if (this.dynamicLayout.dynamicFields.find(x => x.otherAttribute)) {
                    let shipmentType = this.dynamicLayout.dynamicFields.find(x => x.otherAttribute);
                    let IdentierType1 = [];
                    [...shipmentType.otherAttribute.shipment].forEach(x => {
                        IdentierType1.push(x);
                    })
                    this.IdentierType = [...IdentierType1];

                }
               
                if (newJSON[0].fields) {
                    let incidenLoc = this.arCaseRecord.CEC_IncidentLocationCountry__c.value;
                    newJSON[0].fields = [...newJSON[0].fields, ...[{ "Name": "Country_of_Incidence__c", "required": "false", "size": 6, "defaultvalue": incidenLoc }]];
                }
                newJSON[0].fields = newJSON[0].fields.map(x => {
                    if (x.overrideLabel && !x.template) {
                        console.log('sname', x.Name);
                        return { ...x, template: 'cec-overide-label-template' }
                    } else {
                        return { ...x }
                    }
                })
            }
            if (forms.fields.find(x => x.objectApiName === 'CEC_Case_Supplementary_Data__c')) {
                forms.fields = forms.fields.filter(x => x.objectApiName != 'CEC_Case_Supplementary_Data__c');
            }
            let newVr = [...forms.fields, ...newJSON];
            console.log('newVr', newVr);

            return [...forms.fields, ...newJSON];
        }

    }
    //Utility for default recordtype --should be moved cecFormUtility
    getDefaultRecordTypeId(objectApiName) {
        if (this.objectInfo.data)
            return (getObjectInfoByApiName(this.objectInfo.data, objectApiName) || {}).defaultRecordTypeId
    }
    get form() {
        if (this.newForm) {
            form.editMode.fields = this.newForm;
        }
        if (form.editMode.fields == this.newForm && this.newForm) {
            return this.readonly ? form.readMode : form.editMode;
        } else {
            return this.readonly ? form.readMode : form.editMode;
        }
    }
    getRelatedData(objectAPIName, recordId) {
        if (objectAPIName == 'Contact') {
            return this.arContactRecord;
        } else if (objectAPIName == 'CEC_Case_Supplementary_Data__c') {
            // if(this.isReOpen){
            //     this.arInstructionRecord = this.suppData;
            // }
            return this.arInstructionRecord;
        } else if (objectAPIName == 'Case') {
            return this.arCaseRecord;
        }
    }

    //for auto scroll
    isOverrideDone = false
    renderedCallback() {
        var messageEl = this.template.querySelector('.scrollhere')
        if (messageEl && (this.readonly || !this.loaded)) {
            messageEl.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }
        if (this.shipmentdatatable) {
            messageEl.scrollIntoView(false);
        }
        if (this.template.querySelectorAll('lightning-input-field')) {
            console.log('light int', this.template.querySelectorAll('lightning-input-field'));
            let cField = [...this.template.querySelectorAll('lightning-input-field')].filter(x => x.fieldName == 'Country_of_Incidence__c');
            if (cField && cField[0]) {
                cField[0].className = 'slds-hide';
                console.log('newjs', cField[0].className);
            }

        }
        let cField2 = [...this.template.querySelectorAll('lightning-input-field')];
        cField2.forEach(y => {
            console.log('elements', y.classList);
        })

    }
    get fields() {
        return [
            ID_FIELD,
            CASENUMBER_FIELD,
            CASESTATUS_FIELD,
            CASEPRODUCT_FIELD
        ]
    }
    get formInfo() {

        var formInfo = Object.assign(
            {},
            this.form,
            {
                id: getFieldValue(this.caseRecord.data, this.form.id, this.form.objectApiName),
                defaultValueId: getFieldValue(this.caseRecord.data, this.form.id, this.form.objectApiName),
                recordTypeId: this.arCaseRecord.RecordTypeId.value
            },
            {
                fields: this.form.fields.filter(field => !this.evalCondition(field.hidden, this.arCaseRecord, this.form.objectApiName))
                    .map((field, index) => {
                        //Inner Layout Fields Construction
                        if (field.layout) {
                            return Object.assign(
                                {},
                                field,
                                {
                                    isLayout: true,
                                    key: index,
                                },
                                {
                                    fields: field.fields.filter(fieldField => !this.evalCondition(fieldField.hidden, this.arCaseRecord, field.objectApiName))
                                        .map((fieldField, fieldIndex) => {
                                            return this.getField(fieldField, this.arCaseRecord, this.form.objectApiName, index + '_' + fieldIndex)
                                        }),

                                }
                            )
                        }//Composite Fields Construction
                        else if (!field.fields || (field.fields && !field.objectApiName)) {
                            return this.getField(field, this.arCaseRecord, this.form.objectApiName, index + '_')
                        }//Parent Form Fields Construction
                        else {
                            //Not being used as there are no field being edited on Parent Form(Contact Fields) directly
                            return Object.assign(
                                {},
                                field,
                                {
                                    isForm: true,
                                    key: index
                                },
                                {
                                    id: getFieldValue(this.caseRecord.data, field.Name),
                                    defaultValueId: getFieldValue(this.caseRecord.data, this.form.id, this.form.objectApiName)
                                },
                                {
                                    fields: field.fields.filter(fieldField => !this.evalCondition(fieldField.hidden, this.getRelatedData(field.objectApiName), field.objectApiName))
                                        .map((fieldField, fieldIndex) => {
                                            return Object.assign(
                                                {
                                                    key: index + '_' + fieldIndex,
                                                    layoutClass: `slds-form__item field ${this.readonly ? 'read-mode' : 'edit-mode'}`,
                                                    objectApiName: field.objectApiName
                                                },
                                                fieldField,
                                                {
                                                    value: this.evalValue(fieldField, this.getRelatedData(field.objectApiName), fieldField.objectApiName),
                                                    displayValue: this.evalDisplayValue(fieldField, this.getRelatedData(field.objectApiName), fieldField.objectApiName),
                                                    label: fieldField.overrideLabel ? fieldField.overrideLabel : getFieldLabel(getObjectInfoByApiName(this.objectInfo.data, field.objectApiName), fieldField.Name, field.objectApiName),
                                                    helpText: field.objectApiName == 'CEC_Case_Supplementary_Data__c' ? this.getHelpText(getObjectInfoByApiName(this.objectInfo.data, field.objectApiName), fieldField.Name, field.objectApiName) : this.label[fieldField.helpText],
                                                },
                                                {
                                                    required: this.evalCondition(fieldField.required, this.getRelatedData(field.objectApiName), field.objectApiName),
                                                    readonly: this.evalCondition(fieldField.readonly, this.getRelatedData(field.objectApiName), field.objectApiName),
                                                    disabled: this.evalCondition(fieldField.disabled, this.getRelatedData(field.objectApiName), field.objectApiName),
                                                    controlledBy: this.setupControlledBy(fieldField.controlledBy, this.getRelatedData(field.objectApiName), field.objectApiName),
                                                    attribute: {
                                                        ...{
                                                            options: this.overridenOptions(field.objectApiName, fieldField.Name) || this.options(field.objectApiName, fieldField.Name),
                                                            country: (this.getRelatedData(field.objectApiName).CEC_IncidentLocationCountry__c || {}).value

                                                        }, ...fieldField.attribute
                                                    },
                                                    variant: fieldField.overrideLabel ? 'label-hidden' : undefined


                                                }
                                            )
                                        }),

                                },
                                processTemplate(field.template),
                            )
                        }

                    })
            })
        console.log('formInfo', formInfo)
        return formInfo
    }
    getHelpText(objecInfo, fieldApiName, objectApiName) {
        let tst = (objecInfo.fields[fieldApiName] || {}).inlineHelpText;
        console.log('tst', tst);
        return tst;
    }
     //Form generation utility
     getField(field, data, objectApiName, key) {
        return Object.assign(
            {},
            field,
            {
                objectApiName: objectApiName,
                isField: !field.fields,
                isComposite: (field.fields && !field.objectApiName),
                key: key,
                layoutClass: `slds-form__item field ${this.readonly ? 'read-mode' : 'edit-mode'}`
            },
            {
                value: this.evalValue(field, data, objectApiName),
                displayValue: this.evalDisplayValue(field, data, objectApiName),
                label: this.evalLabel(field, data, objectApiName),
                helpText: this.label[field.helpText],
                controlledBy: this.setupControlledBy(field.controlledBy, data, objectApiName),
                attribute: {
                    options: this.options(objectApiName, field.Name),
                    country: (this.arCaseRecord.CEC_IncidentLocationCountry__c || {}).value
                }
            },
            {
                required: this.evalCondition(field.required, data, objectApiName),
                readonly: this.evalCondition(field.readonly, data, objectApiName),
                disabled: this.evalCondition(field.disabled, data, objectApiName),


            },
            //processTemplate(field.template),
        )
    }
    //Form generation utility
    evalLabel(field, data) {
        if (field.fields && !field.objectApiName) {
            return null
        } else if (!field.fields) {
            return field.overrideLabel ? field.overrideLabel : getFieldLabel(getObjectInfoByApiName(this.objectInfo.data, this.form.objectApiName), field.Name, this.form.objectApiName)
        }
    }
    //Form generation utility
    evalValue(field, data) {
        if (field.template == "cec-address-optional") {
            return this.arAddress
        } if (field.Name == 'CEC_MaintainResponsibilityQueue__c') {
            return data[field.Name].value && !this.isReOpen ? {
                id: data[field.Name].value,
                title: data[field.Name].value,
                icon: "standard:groups"
            } : null
        }
        else if (!field.fields && field.defaultvalue) {
            //    console.log('in inside',this.arCaseRecord[field.defaultvalue].value);
            if (field.defaultvalue.fieldApiName && (!data[field.Name] || (data[field.Name] && data[field.Name].value))) {
                if (this.arCaseRecord[field.defaultvalue.fieldApiName] && this.arCaseRecord[field.defaultvalue.fieldApiName].value) {
                    return this.arCaseRecord[field.defaultvalue.fieldApiName].value;
                }
            }
            if (field.defaultvalue) {
                if (data[field.Name] && data[field.Name].value) {
                    return data[field.Name].value
                } else {
                    if (data[field.Name] && data[field.Name].value == '') {
                        return data[field.Name] = { value: data[field.Name].value, displayValue: null }
                    } return data[field.Name] = { value: field.defaultvalue, displayValue: null }

                }
            }


        }
        else if (!field.fields) {
            return (data[field.Name] || {}).value
        }
    }
    //Form generation utility
    evalDisplayValue(field, data) {
        if (field.fields && !field.objectApiName) {
            return this.arAddress
        } else if (!field.fields) {
            return (data[field.Name] || {}).displayValue || (data[field.Name] || {}).value
        }
    }

    evalCondition(condition, data, objectApiName) {
        if (condition && condition.fieldApiName) {
            //return getFieldValue(data, condition.fieldApiName, objectApiName) == condition.value
            console.log('conditionvalue',(data[condition.fieldApiName] || {}).value, condition.value, (data[condition.fieldApiName] || {}).value == condition.value)
            if(condition.operation == '!=') {
                return (data[condition.fieldApiName] || {}).value != condition.value
            }
            if(condition.operation == 'notContains') {
                //return (data[condition.fieldApiName] || {}).value;
                if(data[condition.fieldApiName] && data[condition.fieldApiName].value){
                    return !data[condition.fieldApiName].value.map(x=>x.id).includes(condition.value)
                }
                return true;
            }
            return (data[condition.fieldApiName] || {}).value == condition.value

        } else if (condition && condition.eval) {
            return new Function("data", "currentScope", "condition", `return ${condition.eval}`)(data, this);
        } else if (condition && condition.controlledBy) {
            return condition.controlledBy.value
        }
        return condition
    }

    overridenOptions(objectApiName, fieldApiName) {
        if (objectApiName == 'CEC_Case_Supplementary_Data__c') {
            if (this.dynamicLayout && this.dynamicLayout.picklistFieldValues && this.dynamicLayout.picklistFieldValues[fieldApiName]) {
                return this.dynamicLayout.picklistFieldValues[fieldApiName].values;
            }
        }
    }

    //picklist utilties: For getting picklist values based on object apiname and fieldapiname
    options(objectApiName, fieldApiName) {
        if (this.picklistValues && this.picklistValues[objectApiName] && this.picklistValues[objectApiName].picklistFieldValues[fieldApiName]) {
            return this.picklistValues[objectApiName].picklistFieldValues[fieldApiName].values
        } else {
            return []
        }

    }
    //picklist utilties: For getting picklist display values
    getFieldDisplayValue(value, objectApiName, fieldApiName) {
        return (this.options(objectApiName, fieldApiName).filter(v => v.value == value)[0] || {}).label
    }
     //Change Event Handlers: For all cecFields(Source can be ligtning-input-field/lighitning-input/lightning-combobox/custom input components)
     handleChange(event) {
        console.log(event.detail, event.detail.value)

        if (event.target.field) {
            console.log("change", event.target.field.Name, event.detail.value)
            this.updateValueFromChangeEvent(
                this.getRelatedData(event.target.field.objectApiName),
                event.target.field,
                event.detail.value,
                event.detail.displayValue,
                event.target.checked
            )
        }
    }
    //Change Event Handlers    
    //Change Event Handlers Utility: For all cecFiellds
    updateValueFromChangeEvent(formData, field, value, displayValue) {
        // this.arNewRecrd = formData;
        console.log('formData', formData);
        switch (field.Name) {
            case "CEC_MaintainResponsibilityQueue__c":
                formData[field.Name] = { value: value ? value.title : null, displayValue }
                break;
            case "CEC_HasMaintainResponsibility__c":
                formData[field.Name] = { value, displayValue }
                break;
            case "CEC_PreferredLanguage__c":
                formData[field.Name] = { value, displayValue: this.getFieldDisplayValue(value, field.objectApiName, field.Name) }
                this.setUpCaseInstructions()
                break;
            default:
                if (field.template == 'cec-supply-order') {
                    this.optionSelected = value;
                    displayValue = value.map(x => x.title).join(',');
                }
                else if (field.template == 'cec-multi-select-lookup') {
                    displayValue = value.map(x => x.title).join(',');
                }
                formData[field.Name] = { value, displayValue}

                break;
        }
        //Added for bug fix 3226929: Dispatch AR cases error box
        setTimeout(() => {
            this.validate(true)
        }, 1);
    }

    handleControlledBy(event) {
        //this.processControlledBy(event.detail)
        this.processControlledBy(event)
    }

    processControlledBy(evnt) {
        this.isSelected = false;
        let controlledBy = evnt.detail;
        if (!controlledBy) {
            return
        } else {
            this.controlledByMap[controlledBy.action] = controlledBy
        }
        let isSelectedCnt = false;
        if (evnt.detail.attribute) {
            if (!evnt.detail.attribute.option2 && controlledBy.attribute.value && !controlledBy.attribute.value.address1) {
                this.arCaseRecord.CEC_PreferredLanguage__c = { value: null, displayValue: null }
                // this.arCaseRecord.CEC_PreferredLanguage__c = { value: "da", displayValue: "Danish" }
                this.arCaseRecord.CEC_PreferredCommunicationChannel__c = { value: null, displayValue: null }
                this.arCaseRecord.SuppliedPhone = { value: null, displayValue: null }
                this.arCaseRecord.SuppliedEmail = { value: null, displayValue: null }
                this.arCaseRecord.CEC_FirstName__c = { value: null, displayValue: null }
                this.arCaseRecord.CEC_LastName__c = { value: null, displayValue: null }
            }

        }
        switch (controlledBy.action) {
            case 'set-optional-address':
                if (controlledBy.attribute.isChecked) {
                    isSelectedCnt = true;
                    this.arCaseRecord.CEC_FirstName__c = { value: this.arContactRecord.FirstName.value, displayValue: null }
                    this.arCaseRecord.CEC_LastName__c = { value: this.arContactRecord.LastName.value, displayValue: null }
                    this.arCaseRecord.CEC_PreferredLanguage__c = { value: this.arContactRecord.CEC_Language__c.value || "en", displayValue: this.arContactRecord.CEC_Language__c.displayValue || "English" }
                    this.arCaseRecord.CEC_PreferredCommunicationChannel__c = { value: this.arContactRecord.CEC_PreferredCommunicationChannel__c.value || "Email", displayValue: this.arContactRecord.CEC_PreferredCommunicationChannel__c.displayValue || "Email" }
                    this.arCaseRecord.SuppliedPhone = { value: this.arContactRecord.Phone.value, displayValue: null }
                    this.arCaseRecord.SuppliedEmail = { value: this.arContactRecord.Email.value, displayValue: null }
                } else {
                    isSelectedCnt = false;
                }
                var field = {
                    Name: 'Contact',
                    objectApiName: 'Contact'
                }
                if (controlledBy.attribute.value.address1) {
                    controlledBy.attribute.isChecked = false;
                    this.dontoverideContactAddress = true
                    //PBI#3673059 - Request Assistance - Confirmation Screen Updates - Bala
                    this.arCaseRecord.CEC_Is_AR_Same_Location__c = { value: true, displayValue: true }
                    this.handleAddressChange({
                        detail: controlledBy.attribute.option1
                    })
                } else if (controlledBy.attribute.value.address2) {
                    //PBI#3673059 - Request Assistance - Confirmation Screen Updates - Bala
                    this.arCaseRecord.CEC_Is_AR_Same_Location__c = { value: false, displayValue: false }
                    this.dontoverideContactAddress = false
                    this.handleAddressChange({
                        detail: controlledBy.attribute.option2
                    })
                }
                break;
            case 'show-field':

                break;
            case 'update-phone-on-contact':
                this.updatePhoneOnContact = controlledBy.attribute.checked
                break;
            case 'update-email-on-contact':
                this.updateEmailOnContact = controlledBy.attribute.checked
                break;
            case 'copy-case-description':
                if (controlledBy.attribute.checked) {
                    this.arInstructionRecord[evnt.target.field.Name] = { value: this.arCaseRecord.Description.value, displayValue: null }

                } else {
                    this.arInstructionRecord[evnt.target.field.Name] = { value: '', displayValue: null }
                    this.arCaseRecord.CEC_AR_Case_Instructions__c

                }
                break;
            case 'copy-AR-description':
                if (controlledBy.attribute.checked) {
                    console.log('evnt atgret', this.arInstructionRecord[evnt.target.field.Name]);
                    console.log('ar case descrpon', this.arCaseRecord.Description.value);
                    this.arInstructionRecord[evnt.target.field.Name] = { value: this.arCaseRecord.Description.value, displayValue: null }

                } else {
                    this.arInstructionRecord[evnt.target.field.Name] = { value: '', displayValue: null }

                }
                break;

            default:
                break;
        }

        return controlledBy
    }



    cancel() {
        const selectedEvent = new CustomEvent("close", {
            detail: {
                removeStartIwantTo: this.isReOpen
            }
        });
        this.dispatchEvent(selectedEvent);

    }
}