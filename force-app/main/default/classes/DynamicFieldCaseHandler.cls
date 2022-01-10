public with sharing class DynamicFieldCaseHandler {
    public DynamicFieldCaseHandler() {

    }

    @AuraEnabled(cacheable=true)
    public static CEC_Case_Supplementary_Data__c getSupplementaryData(Id recordId,List<string> fields){
        List<CEC_Case_Supplementary_Data__c> cS1 = new List<CEC_Case_Supplementary_Data__c>();
        string query = 'SELECT ID,';
        for(string fld : fields){
            query += fld + ', ';
        } 

        query += 'FROM CEC_Case_Supplementary_Data__c where CEC_Parent_Case__c =: recordId LIMIT 1';

        List<sObject> sObjList = Database.query(query);
        for(Object obj : sObjList){
            CEC_Case_Supplementary_Data__c cS = new CEC_Case_Supplementary_Data__c();
            cS = (CEC_Case_Supplementary_Data__c)obj;
            cS1.add(cs);
        }

        if(!cS1.isEmpty()){
            return cS1[0];
        }return null;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String,Object> getSupplementaryFieldsFromRouting(String cntry,string bUnit){
        List<Routing_Table__c> rTable = [SELECT Id, Name, Business_Unit__c, Country__c,Supplementary_Fields__c
         FROM Routing_Table__c where Country__c =: cntry AND Business_Unit__c =: bUnit];
        
        String dynamicfieldsJson;       
        if(!rTable.isEmpty()){
            dynamicfieldsJson=rTable[0].Supplementary_Fields__c;
        }
        if(dynamicfieldsJson != null){
            Map<String,Object> dynamicf= (Map<String,Object>)JSON.deserializeUntyped(dynamicfieldsJson);
            List<Map<String, Object>> dynamicfields = new List<Map<String, Object>>();
            List<Object> myMapObjects = (List<Object>) dynamicf.get('result');
            for (Object obj : myMapObjects) {
                dynamicfields.add((Map<String, Object>)obj);
            }
            SObjectType arInstructionType = Schema.getGlobalDescribe().get('CEC_Case_Supplementary_Data__c');
            Map<String,Schema.SObjectField> fieldMap = arInstructionType.getDescribe().fields.getMap();
            map<string,Map<String,Object>> dynamicFieldsOptions= new map<string,Map<String,Object>>();
            for(Map<String,Object> dynamicfield:dynamicfields){
                if(dynamicfield.containskey('Name')) {
                Schema.SObjectField field = fieldMap.get(string.valueOf(dynamicfield.get('Name')));
                List<Object> options= new List<Object>();
                List<Schema.PicklistEntry> ple = field.getDescribe().getPicklistValues();
                if(field.getDescribe().getPicklistValues() != null){
                    for( Schema.PicklistEntry f : ple){
                        options.add(new Map<String,Object>{'label'=>f.getLabel(),'value'=>f.getValue()});
                    }
                    dynamicFieldsOptions.put(string.valueof(dynamicfield.get('Name')),new Map<String,Object>{'values'=>options});
                }
            }
            }
            return new Map<String,Object>{
                'dynamicFields'=>dynamicfields,'picklistFieldValues'=>dynamicFieldsOptions
                    }; 
         }
        return null;
    }
      /**
    * @description: 1692293-Phone Numbers in Appropriate Country Format 
    * @author PS 
    * @return List<CEC_Country_Mapping__mdt> 
    **/
    @AuraEnabled(cacheable=true)
    public static List<CEC_Country_Mapping__mdt> getCountryMappingDetails() {
        return [Select DeveloperName, MasterLabel, Label,Country_ISO2Code__c,Postal_Code__c,City__c,
                (Select Id,CEC_City__c,CEC_Context__c,CEC_PostalCode__c,CEC_State__c,CEC_Street__c From CEC_Country_Context_Mappings__r) 
                From CEC_Country_Mapping__mdt order by MasterLabel asc]; 
    }

     /**
    * @description: 1692293-Phone Numbers in Appropriate Country Format 
    * @author PS 
    * @return List<CEC_Country_Mapping__mdt> 
    **/
    @AuraEnabled(cacheable=true)
    public static Map<String,CEC_Exceptional_Country__mdt> getExceptionalCountryMappingDetails() {
        Map<String,CEC_Exceptional_Country__mdt>  exceptionalCountryMap = new Map<String,CEC_Exceptional_Country__mdt> ();


        List<CEC_Exceptional_Country__mdt>  exceptionalCountryList = [Select CEC_Country_Label__c, CEC_Country_ExceptionalLabel__c, CEC_Country_ISO2Code__c
                From CEC_Exceptional_Country__mdt order by MasterLabel asc]; 

        for (CEC_Exceptional_Country__mdt exceptionalCountry : exceptionalCountryList) {
            exceptionalCountryMap.put(exceptionalCountry.CEC_Country_Label__c,exceptionalCountry);
        }
        return exceptionalCountryMap;
    }
}
