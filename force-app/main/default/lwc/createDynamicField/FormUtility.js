import { getObjectInfo as goi } from 'lightning/uiObjectInfoApi';
import { getRecord, updateRecord, generateRecordInputForUpdate, getFieldValue as gfv, getRecordNotifyChange } from 'lightning/uiRecordApi';
const toCamel = (s) => {
    if (!s)
        return
    return s.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    });
};
function processTemplate(templateString) {
    if (templateString) {
        var template = {}
        template[toCamel(templateString)] = true
        return {
            template
        };
    }
}
function getLabel() {

}
function getFieldLabel(objecInfo, fieldApiName, objectApiName) {
    return (objecInfo.fields[fieldApiName] || {}).label
}
function getFieldValue(objectWire, fieldApiName, objectApiName) {
    return gfv(objectWire, {
        fieldApiName,
        objectApiName
    })
}
function getObjectInfoByApiName(objectInfos, objectApiName) {
    return (objectInfos.results.filter(v => v.result.apiName == objectApiName)[0] || {}).result
}
export { toCamel, processTemplate, getLabel, getFieldLabel, getFieldValue, getObjectInfoByApiName }