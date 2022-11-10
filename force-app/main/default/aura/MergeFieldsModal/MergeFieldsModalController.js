({
    doInit : function(component, event, helper) {
        helper.getContactFields(component);
    },  

    handleKeyUp : function(component, event, helper) {
        let queryTerm = component.find('enter-search').get('v.value');
        if(queryTerm !== '' && (event.keyCode === 13 || event.keyCode === 8)) {
            let allFields = component.get('v.allContactFields');
            let searchResult = [];
            allFields.forEach(el => {
                if(el.label.toLowerCase().includes(queryTerm.toLowerCase())) 
                    searchResult.push(el);
            });
            component.set('v.displayFields', searchResult);
        } else if(queryTerm === ''){
            component.set('v.displayFields', component.get('v.allContactFields'))
        }
    },

    handleCheckboxClick : function(component, event, helper) {
        let label = event.getSource().get('v.label')
        let checkboxes = component.find("selectedCheckbox");
        for(let i = 0; i < checkboxes.length; i++) {
            if(checkboxes[i].get('v.label') !== label)
                checkboxes[i].set("v.checked", false);
        }
    },

    closeModal : function(component, event, helper) {
        component.set('v.isOpen', false);
    },

    submitDetails : function(component, event, helper) {
        let checkboxes = component.find("selectedCheckbox");
        for(let i = 0; i < checkboxes.length; i++) {
            if(checkboxes[i].get('v.checked') === true) {
                component.set('v.choosedField', checkboxes[i].get("v.name"));
                component.set("v.isOpen", false);
                break;
            }
        }
        
        let settedUp = component.get("v.choosedField");
        if(!settedUp) {
            component.find('notif').showToast({
                "title": "Can`t insert filed",
                "variant": "warning",
                "message": "You have to choose filed!"
            });
        }
    }
})