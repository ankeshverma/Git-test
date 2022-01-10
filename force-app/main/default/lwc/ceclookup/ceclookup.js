import { LightningElement, api, track } from 'lwc';

//const MINIMAL_SEARCH_TERM_LENGTH = 2; // Min number of chars required to search
const SEARCH_DELAY = 300; // Wait 300 ms after user stops typing then, peform search
const ARROW_UP = 38;
const ARROW_DOWN = 40;
const ENTER = 13;

export default class Lookup extends LightningElement {
    // Public properties
    @api label;
    @api required;
    @api placeholder = '';
    @api isMultiEntry = false;
    @track errors = [];
    @api scrollAfterNItems;
    @api customKey;
    @api messageWhenValueMissing='Complete this field'
    @api showDefaultResults = false;
    @api minimumSearchTermLength = 2;
    @track customValidityMessage;

    // Template properties
    searchResultsLocalState = [];
    loading = false;

    // Private properties
    _hasFocus = false;
    _isDirty = false;
    _searchTerm = '';
    _cleanSearchTerm;
    _cancelBlur = false;
    _searchThrottlingTimeout;
    _searchResults = [];
    _defaultSearchResults = [];
    _curSelection = [];
    _focusedResultIndex = null;

    // PUBLIC FUNCTIONS AND GETTERS/SETTERS
    @api
    set selection(initialSelection) {
        if(initialSelection){
            this._curSelection = Array.isArray(initialSelection) ? initialSelection : [initialSelection];
            this._isDirty = false;
        }
    }

    get selection() {
        return this._curSelection;
    }

    @api 
    reset() {
        //Reset
        this.loading=true;
        this._cleanSearchTerm = '';
        this._searchTerm = '';
        this._searchResults = this._defaultSearchResults;
        this.setSearchResults([])
    }

    @api
    setSearchResults(results) {
        // Reset the spinner
        this.loading = false;
        // Clone results before modifying them to avoid Locker restriction
        const resultsLocal = JSON.parse(JSON.stringify(results));
        // Format results
        const regex = new RegExp(`(${this._searchTerm})`, 'gi');
        this._searchResults = resultsLocal.map((result) => {
            // Format title and subtitle
            if (this._searchTerm.length > 0) {
                result.titleFormatted = result.title
                    ? result.title.replace(regex, '<strong>$1</strong>')
                    : result.title;
                result.subtitleFormatted = result.subtitle
                    ? result.subtitle.replace(regex, '<strong>$1</strong>')
                    : result.subtitle;
            } else {
                result.titleFormatted = result.title;
                result.subtitleFormatted = result.subtitle;
            }
            // Add icon if missing
            if (typeof result.icon === 'undefined') {
                result.icon = 'standard:default';
            }
            return result;
        });
        if(this.isMultiEntry)
        {
            this._searchResults=this._searchResults.filter(x => !(this.selection || []).map(f => f.id).includes(x.id))
        }
        // Add local state and dynamic class to search results
        this._focusedResultIndex = null;
        const self = this;
        this.searchResultsLocalState = this._searchResults.map((result, i) => {
            return {
                result,
                state: {},
                get classes() {
                    let cls =
                        'slds-media slds-listbox__option slds-listbox__option_entity slds-listbox__option_has-meta';
                    if (self._focusedResultIndex === i) {
                        cls += ' slds-has-focus';
                    }
                    return cls;
                }
            };
        });
    }

    @api
    getSelection() {
        return this._curSelection;
    }

    @api
    getkey() {
        console.warn('Lookup.getkey() is deprecated and will be removed in a future version.');
        return this.customKey;
    }

    @api
    setDefaultResults(results) {
        this._defaultSearchResults = [...results];
        if (this._searchResults.length === 0) {
            this.setSearchResults(this._defaultSearchResults);
        }
    }
    @api
    reportValidity(){
        if( this.errors && this.required && this.getSelection().length==0){
            if(this.errors.indexOf(this.messageWhenValueMissing)<0)
            this.errors.push(this.messageWhenValueMissing)
            
            return false
        }
        else if( this.customValidityMessage){
            return false
        }
        else{
            this.errors=[]
            return true
        }
    }
    @api
    checkValidity(){
        if(this.errors&&this.errors.length>0){
            return false
        }else{
            return true
        }
    }
    @api
    setCustomValidity(message){
        if(message && this.errors && this.errors.indexOf(message)==-1){
            this.errors.push(message);
            this.customValidityMessage=message;
        }
        else if(this.customValidityMessage) {
            this.customValidityMessage=null;
            this.errors=[];
        }
    }
	
	 


    // INTERNAL FUNCTIONS

    updateSearchTerm(newSearchTerm) {
        //Added this condition when user want to showdefault records on focus.
        if(newSearchTerm && newSearchTerm != '$default'){
            this._searchTerm = newSearchTerm;
        }
        //Empty input and showDefaultResults.
        if(!newSearchTerm && this.showDefaultResults){
            newSearchTerm = '$default';
        }

        // Compare clean new search term with current one and abort if identical
        const newCleanSearchTerm = newSearchTerm.trim().replace(/\*/g, '').toLowerCase();
        if (this._cleanSearchTerm === newCleanSearchTerm) {
            return;
        }

        // Save clean search term
        this._cleanSearchTerm = newCleanSearchTerm;

        // Ignore search terms that are too small
        if (newCleanSearchTerm.length < this.minimumSearchTermLength) {
            this.setSearchResults(this._defaultSearchResults);
            return;
        }

        // Apply search throttling (prevents search if user is still typing)
        if (this._searchThrottlingTimeout) {
            clearTimeout(this._searchThrottlingTimeout);
        }
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._searchThrottlingTimeout = setTimeout(() => {
            // Send search event if search term is long enougth
            if (this._cleanSearchTerm.length >= this.minimumSearchTermLength) {
                // Display spinner until results are returned
                this.loading = true;

                const searchEvent = new CustomEvent('search', {
                    detail: {
                        searchTerm: this._cleanSearchTerm,
                        selectedIds: this._curSelection?this._curSelection.map((element) => element.id):[]
                    }
                });
                this.dispatchEvent(searchEvent);
            }
            this._searchThrottlingTimeout = null;
        }, SEARCH_DELAY);
    }

    isSelectionAllowed() {
        if (this.isMultiEntry) {
            return true;
        }
        return !this.hasSelection();
    }

    hasResults() {
        return this._searchResults.length > 0;
    }

    hasSelection() {
        return this._curSelection.length > 0;
    }

    // EVENT HANDLING

    handleInput(event) {
        // Prevent action if selection is not allowed
        if (!this.isSelectionAllowed()) {
            return;
        }
        this.updateSearchTerm(event.target.value);
    }

    handleKeyDown(event) {
        if (this._focusedResultIndex === null) {
            this._focusedResultIndex = -1;
        }
        if (event.keyCode === ARROW_DOWN) {
            // If we hit 'down', select the next item, or cycle over.
            this._focusedResultIndex++;
            if (this._focusedResultIndex >= this._searchResults.length) {
                this._focusedResultIndex = 0;
            }
            event.preventDefault();
        } else if (event.keyCode === ARROW_UP) {
            // If we hit 'up', select the previous item, or cycle over.
            this._focusedResultIndex--;
            if (this._focusedResultIndex < 0) {
                this._focusedResultIndex = this._searchResults.length - 1;
            }
            event.preventDefault();
        } else if (event.keyCode === ENTER && this._hasFocus && this._focusedResultIndex >= 0) {
            // If the user presses enter, and the box is open, and we have used arrows,
            // treat this just like a click on the listbox item
            const selectedId = this._searchResults[this._focusedResultIndex].id;
            this.template.querySelector(`[data-recordid="${selectedId}"]`).click();
            event.preventDefault();
        }
    }

    handleResultClick(event) {
        const recordId = event.currentTarget.dataset.recordid;

        // Save selection
        let selectedItem = this._searchResults.filter((result) => result.id === recordId);
        if (selectedItem.length === 0) {
            return;
        }
        selectedItem = selectedItem[0];
        const newSelection = [...this._curSelection];
        newSelection.push(selectedItem);
        this._curSelection = newSelection;
        this._isDirty = true;

        // Reset search
        this._cleanSearchTerm = '';
        this._searchTerm = '';
        this._searchResults = this._defaultSearchResults;
        this.reportValidity();
        // Notify parent components that selection has changed
        this.dispatchSelectionChange();
    }

    // @api
    // doupdateResultOnSelectionChange=false;

    dispatchSelectionChange() {
        this.dispatchEvent(new CustomEvent('selectionchange', {
             detail: this.isMultiEntry? this._curSelection: (this._curSelection.length>0?this._curSelection[0]:null) }));
    }

    handleComboboxMouseDown(event) {
        const mainButton = 0;
        if (event.button === mainButton) {
            this._cancelBlur = true;
        }
    }

    handleComboboxMouseUp() {
        this._cancelBlur = false;
        // Re-focus to text input for the next blur event
        this.template.querySelector('input').focus();
    }

    handleFocus() {
       // this.updateSearchTerm('$default');
     //   Prevent action if selection is not allowed
        if (!this.isSelectionAllowed()) {
            return;
        }
        this._hasFocus = true;
        this._focusedResultIndex = null;
        
        //on focus show the default records...
        if(this.showDefaultResults){
            this.updateSearchTerm('$default');
       }
    }

    handleBlur(event) {
        
        // Prevent action if selection is either not allowed or cancelled
        if (!this.isSelectionAllowed() || this._cancelBlur) {
            return;
        }
        this._hasFocus = false;

        this.reportValidity();
        if(this.getSelection().length==0){
            event.target.value='';
            this._searchTerm='';
        }
        const blurEvent = new CustomEvent('blur');
        this.dispatchEvent(blurEvent);
    }

    handleRemoveSelectedItem(event) {
        const recordId = event.currentTarget.name;
        this._curSelection = this._curSelection.filter((item) => item.id !== recordId);
        this._isDirty = true;
        // Notify parent components that selection has changed
        this.dispatchSelectionChange();
        this.reportValidity()
    }

    @api handleClearSelection() {
        this._curSelection = [];
        this._isDirty = true;
        // Notify parent components that selection has changed
        this.reportValidity();
        this.dispatchSelectionChange();
    }

    // STYLE EXPRESSIONS

    get getContainerClass() {
        let css = 'slds-combobox_container slds-has-inline-listbox ';
        if (this._hasFocus && this.hasResults()) {
            css += 'slds-has-input-focus ';
        }
        if (this.errors.length > 0) {
            css += 'has-custom-error';
        }
        return css;
    }

    get getDropdownClass() {
        let css = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ';
        const isSearchTermValid = this._cleanSearchTerm && this._cleanSearchTerm.length >= this.minimumSearchTermLength;
        if (this._hasFocus && (isSearchTermValid || this.hasResults())) {
            css += 'slds-is-open';
        }
        return css;
    }

    get getInputClass() {
        let css = 'slds-input slds-combobox__input has-custom-height ';
        if(!this.getSelectIconName){
            css+= ' icon-less-selection '   
        }
        
        if (this.errors.length > 0 || (this._isDirty && this.required && !this.hasSelection())) {
            css += 'has-custom-error ';
        }
        if (!this.isMultiEntry) {
            css += 'slds-combobox__input-value ' + (this.hasSelection() ? 'has-custom-border' : '');
        }
        return css;
    }

    get getComboboxClass() {
        let css = 'slds-combobox__form-element slds-input-has-icon ';
        if (this.isMultiEntry) {
            css += 'slds-input-has-icon_right';
        } else {
            css += this.hasSelection() ? 'slds-input-has-icon_left-right' : 'slds-input-has-icon_right';
        }
        return css;
    }

    get getSearchIconClass() {
        let css = 'slds-input__icon slds-input__icon_right ';
        if (!this.isMultiEntry) {
            css += this.hasSelection() ? 'slds-hide' : '';
        }
        return css;
    }

    get getClearSelectionButtonClass() {
        return (
            'slds-button slds-button_icon slds-input__icon slds-input__icon_right ' +
            (this.hasSelection() ? '' : 'slds-hide')
        );
    }

    get getSelectIconName() {
        return this.hasSelection() ? this._curSelection[0].icon : 'standard:default';
    }

    get getSelectIconClass() {
        return 'slds-combobox__input-entity-icon ' + (this.hasSelection() ? '' : 'slds-hide');
    }

    get getInputValue() {
        if (this.isMultiEntry) {
            return this._searchTerm;
        }
        return this.hasSelection() ? this._curSelection[0].title : this._searchTerm;
    }

    get getInputTitle() {
        if (this.isMultiEntry) {
            return '';
        }
        return this.hasSelection() ? this._curSelection[0].title : '';
    }

    get getListboxClass() {
        return (
            'slds-listbox slds-listbox_vertical slds-dropdown slds-dropdown_fluid ' +
            (this.scrollAfterNItems ? 'slds-dropdown_length-with-icon-' + this.scrollAfterNItems : '')
        );
    }

    get isInputReadonly() {
        if (this.isMultiEntry) {
            return false;
        }
        return this.hasSelection();
    }

    get isExpanded() {
        return this.hasResults();
    }
}