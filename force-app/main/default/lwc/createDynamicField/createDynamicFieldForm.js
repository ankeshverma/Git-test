const form = {
    editMode: {
        id: 'Id',
        objectApiName: 'Case',
        defaultValueId: 'Id',
        fields: [
            { Name: 'Description', hidden: true },
            // { Name: 'CEC_CountryOfOrigin__c', hidden: true },
            // { Name: 'Priority', size: 3 ,required:true,template: 'lightning-combobox'},
            // { Name: 'CEC_Case_Category__c', readonly: true, size: 3 },
            // { Name: 'CEC_Case_Sub_Category__c', readonly: true, size: 3 },
            // { Name: 'CEC_Receivedfrom__c', hidden: true},
            // { Name: 'CEC_BusinessUnit__c', hidden: true},
            // { Name: 'CEC_IncidentLocationCountry__c', hidden: true},
            // { Name: 'CEC_IncidentLocationStreet__c', hidden: true},
            // { Name: 'CEC_IncidentLocationCity__c', hidden: true},
            // { Name: 'CEC_IncidentLocationPostalCode__c', hidden: true},
            // { Name: 'CEC_IncidentLocationState__c', hidden: true},
            // { Name: 'CEC_Original_Queue_Name__c', hidden: true},
            // {   
            //     layout:true,
            //     size:12,
            //     fields:[
            //         { Name: 'CEC_HasMaintainResponsibility__c', size: 6, template: 'cec-toggle' ,helpText:'CEC_Case_Mandatoty_HelpText',
            //         disabled: {
            //             eval:'!currentScope.isMaintainResponsbilityAllowProfile',
            //         },
            //      },
            //         { Name: 'CEC_Original_Queue_Name__c', hidden: true},
            //         { Name: 'CEC_MaintainResponsibilityQueue__c', 
            //             hidden: {
            //                 fieldApiName: 'CEC_HasMaintainResponsibility__c',
            //                 value: false,
            //             },
            //             required:true,
            //             readonly: {
            //                 eval:'data.CEC_Original_Queue_Name__c.value && !currentScope.isReOpen'
            //             },
            //             controlledBy:{
            //                 name:'original_queue',
            //                 attribute:{
            //                     value:{
            //                         fieldApiName: 'CEC_Original_Queue_Name__c'
            //                     }
            //                 }
            //             },
            //             size: 6,
            //             template: 'cec-lookup' 
            //         }
            //     ]
            // },
            // { Name: 'CEC_CallbackRequired__c', size:12,template: 'cec-toggle',helpText:'CEC_CallBackRequiredHelpText'},
            // {
            //     Name: 'IncidentLocation',
            //     controlledBy: {
            //         type: 'checbox',
            //         action: 'set-optional-address',
            //         label: "CEC_Case_AR_is_Incident_Location_Same",
            //         value: true,
            //         attribute: {
                        
            //             name: 'optionaladdress'
            //         }
            //     },
            //     fields: [
            //         {
            //             Name: 'CEC_IncidentLocationCountry__c'
            //         },
            //         {
            //             Name: 'CEC_IncidentLocationStreet__c'
            //         }, ,
            //         {
            //             Name: 'CEC_IncidentLocationCity__c'
            //         },
            //         {
            //             Name: 'CEC_IncidentLocationPostalCode__c'
            //         },
            //         {
            //             Name: 'CEC_IncidentLocationState__c'
            //         }
            //     ],
            //     template: 'cec-address-optional',
            //     attribute: {
            //         'country': 'CEC_IncidentLocationCountry__c',
            //         'street': 'CEC_IncidentLocationStreet__c',
            //         'city': 'CEC_IncidentLocationCity__c',
            //         'postal-code': 'CEC_IncidentLocationPostalCode__c',
            //         'state': 'CEC_IncidentLocationState__c'
            //     }

            // },
			// {
            //     Name: 'CEC_FirstName__c', size: 6,required:{
            //         eval:'!currentScope.isSelected'
            //     }
            // },
            // {
            //     Name: 'CEC_LastName__c', size: 6,required:{
            //         eval:'!currentScope.isSelected'
            //     }
            // },
            // {
            //     Name: 'CEC_PreferredCommunicationChannel__c', size: 6,required:true,                
            //     template: 'lightning-combobox'
            // },
            // {
            //     Name: 'CEC_PreferredLanguage__c',
            //     size: 6,
            //     required:true,
            // },
            // {
            //     Name: 'SuppliedEmail', size: 6,
            //     required: {
            //         fieldApiName: 'CEC_PreferredCommunicationChannel__c',
            //         value: 'Email',
            //     },
            //     template: "cec-email",
            //     controlledBy: {
            //         type: 'checbox',
            //         action: 'update-email-on-contact',
            //         label: "CEC_Case_AR_Update_Email_on_contact",
            //         attribute: {
            //             checked: false
            //         }
            //     },
            // },
            // {
            //     Name: 'SuppliedPhone', size: 6,
            //     template: "cecphone",
            //     required: {
            //         fieldApiName: 'CEC_PreferredCommunicationChannel__c',
            //         value: 'Phone',
            //     },
            //     controlledBy: {
            //         type: 'checbox',
            //         action: 'update-phone-on-contact',
            //         label: "CEC_Case_AR_Update_Phone_on_contact",
            //         attribute: {
            //             checked: false
            //         }
            //     },
            // },
            {
                id: 'ContactId',
                Name: 'Contact',
                objectApiName: 'Contact',
                defaultValueId: 'ContactId',
                fields: [
                    {
                        Name: 'Email', hidden: true
                    },
                    {
                        Name: 'Phone', hidden: true
                    },
                    // {
                    //     Name: 'CEC_PreferredCommunicationChannel__c', hidden: true
                    // },
                    // {
                    //     Name: 'CEC_Language__c', hidden: true
                    // },
                    // {
                    //     Name: 'Account.ShippingCountry', hidden: true
                    // },
                    // {
                    //     Name: 'Account.ShippingStreet', hidden: true
                    // },
                    // {
                    //     Name: 'Account.ShippingCity', hidden: true
                    // },
                    // {
                    //     Name: 'Account.ShippingPostalCode', hidden: true
                    // },
                    // {
                    //     Name: 'Account.ShippingState', hidden: true
                    // }
                ]
            }
        ]
    },
    readMode: {
        // id: 'Id',
        // objectApiName: 'Case',
        // defaultValueId: 'Id',
        // //@depecreted left for backup purpose
        // fields: [
        //     {   
        //         layout:true,
        //         size:6,
        //         fields:[
        //             { Name: 'CEC_Case_Category__c', readonly: true, size: 12 },
        //             { Name: 'CEC_Case_Sub_Category__c', readonly: true, size: 12 }, 
        //             { Name: 'Priority', readonly: true,size: 12 },           
        //             { Name: 'CEC_Receivedfrom__c', readonly: true, size: 12 },
        //             { Name: 'CEC_BusinessUnit__c', readonly: true, size: 12 },
        //         ]
        //     },
        //     {   
        //         layout:true,
        //         size:6,
        //         fields:[
        //             {
        //                 controlledBy: {
        //                     type: 'checbox',
        //                     action: 'set-optional-address',
        //                     label: "CEC_Case_AR_is_Incident_Location_Same",
        //                     value: true,
        //                     attribute: {
        //                         value: {
        //                             address1: true,
        //                             address2: false
        //                         },
        //                         name: 'optionaladdress'
        //                     }
        //                 },
        //                 readonly: true,
        //                 fields: [
        //                     {
        //                         Name: 'CEC_IncidentLocationCountry__c'
        //                     },
        //                     {
        //                         Name: 'CEC_IncidentLocationStreet__c'
        //                     }, ,
        //                     {
        //                         Name: 'CEC_IncidentLocationCity__c'
        //                     },
        //                     {
        //                         Name: 'CEC_IncidentLocationPostalCode__c'
        //                     },
        //                     {
        //                         Name: 'CEC_IncidentLocationState__c'
        //                     }
        //                 ],
        //                 template: 'cec-address-optional',
        //                 attribute: {
        //                     'country': 'CEC_IncidentLocationCountry__c',
        //                     'street': 'CEC_IncidentLocationStreet__c',
        //                     'city': 'CEC_IncidentLocationCity__c',
        //                     'postal-code': 'CEC_IncidentLocationPostalCode__c',
        //                     'state': 'CEC_IncidentLocationState__c'
        //                 }
        
        //             },
        //         ]
        //     },
        //     { Name: 'CEC_HasMaintainResponsibility__c', readonly: true, size: 6, template: 'cec-toggle',
        //         hidden: {
        //             fieldApiName: 'CEC_HasMaintainResponsibility__c',
        //             value: false,
        //         }
        //     },
        //     { Name: 'CEC_MaintainResponsibilityQueue__c', readonly: true, size: 6, template: 'cec-lookup' ,
        //         hidden: {
        //             fieldApiName: 'CEC_HasMaintainResponsibility__c',
        //             value: false,
        //         }
        //     },
        //     {
        //         Name: 'CEC_AR_Case_Instructions__c', size: 12,
        //         template: 'lightning-formatted-text',
        //         readonly: true,                
        //         controlledBy: {
        //             type: 'checbox',
        //             action: 'copy-case-description',
        //             label: "CEC_Case_AR_Copy_Description",
        //             value: true
        //         },
        //     },            
        //     {
        //         id: 'ContactId',
        //         Name: 'Contact',
        //         objectApiName: 'Contact',
        //         defaultValueId: 'ContactId',
        //         fields: [
        //             {
        //                 Name: 'CEC_PreferredCommunicationChannel__c',
        //                 readonly: true,
        //                 size: 6
        //             },
        //             {
        //                 Name: 'CEC_Language__c',
        //                 readonly: true,
        //                 size: 6,
        //                 template: 'lightning-combobox'
        //             },
        //             {
        //                 Name: 'Email', size: 6,
        //                 readonly: true,
        //                 required: {
        //                     fieldApiName: 'CEC_PreferredCommunicationChannel__c',
        //                     value: 'Email',
        //                 },
        //                 template: "cec-email",
        //                 controlledBy: {
        //                     type: 'checbox',
        //                     action: 'update-email-on-contact',
        //                     label: "CEC_Case_AR_Update_Email_on_contact",
        //                     value: true
        //                 },
        //             },
        //             {
        //                 Name: 'Phone', size: 6,
        //                 template: "cecphone",
        //                 readonly: true,
        //                 required: {
        //                     fieldApiName: 'CEC_PreferredCommunicationChannel__c',
        //                     value: 'Phone',
        //                 },
        //                 controlledBy: {
        //                     type: 'checbox',
        //                     action: 'update-phone-on-contact',
        //                     label: "CEC_Case_AR_Update_Phone_on_contact",
        //                     value: true
        //                 },
        //             }
        //         ]
        //     }
        // ],
        //override @depcreted
        fields: []

    }
}
export { form }