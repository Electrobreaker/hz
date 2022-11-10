({
    getContactFields: function(component) {
        return new Promise($A.getCallback(function(resolve, reject) {
            let action = component.get("c.getContactFields");
            action.setCallback(this, function(response) {
                let STATE = response.getState();
                if(STATE === "SUCCESS") {
                    let result = response.getReturnValue();
                    component.set('v.allContactFields', result);
                    component.set('v.displayFields', result);
                }
                else if (STATE === "ERROR") {
                    let errors = response.getError();
                    if (errors) {
                        if (errors[0] && errors[0].message) {
                            console.log("Error message: " + 
                                        errors[0].message);
                        }
                    } else {
                        console.log("Unknown error");
                    }
                }
            });
            $A.enqueueAction(action);
        }));
    }
})