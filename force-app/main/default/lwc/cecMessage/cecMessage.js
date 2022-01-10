import { LightningElement,api } from 'lwc';

class Deferred {
    _instance;
    reject;
    resolve;
    get promise(){
        return new Promise((resolve, reject)=>{
            this.reject = reject
            this.resolve = resolve
        })
    };
    constructor(){
        if (Deferred._instance) {
            return Deferred._instance
        }
        Deferred._instance = this; 
    }
    
  }
  

export default class CecMessage extends LightningElement {
    @api label

    @api iconName

    _iconClass
    @api 
    set iconClass(value){
        this._iconClass=value
    }
    get iconClass(){
        return 'slds-p-right_small '+this._iconClass
    }

    @api iconSize ="small"
    @api iconSrc
    @api iconTitle
    @api iconVariant

    @api variant //allowed values:info,error,custom

    @api type = 'normal' //allowed values : modal,normal

    get isModal(){
        return this.type==='modal'
    }

    get messageClass(){
        return `slds-p-around_large slds-align_absolute-center cec-${this.variant}`
    }

    get modalClass(){
        if(this.isModal){
            return "slds-modal slds-fade-in-open slds-modal_prompt slds-is-absolute"
        }
        return ""
    }
    get modalContainerClass(){
        if(this.isModal){
            return "slds-modal__container"
        }
        return ""
    }

    get modalContentClass(){
        if(this.isModal){
            return "slds-modal__content slds-p-around_medium"
        }
        return "slds-p-around_medium"
    }

    get modalBackDropClass(){
        if(this.isModal){
            return "slds-backdrop slds-backdrop_open slds-is-absolute"
        }
        return ""
    }

    @api
    prompt() {
        this.classList.toggle('slds-hide')
        return new Deferred().promise

    }
    @api
    resolve(message){
        this.classList.toggle('slds-hide')
        new Deferred().resolve(message)
    }
    @api
    reject(message){
        this.classList.toggle('slds-hide')
        new Deferred().resolve(message)
    }




    
    
}