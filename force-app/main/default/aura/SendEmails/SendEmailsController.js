({
    doInit : function(component, event, helper) {
        let myPageRef = component.get("v.pageReference");
        let contacts = myPageRef.state.c__listOfContacts;

        console.log('listOfContacts', JSON.stringify(contacts));
        component.set("v.listOfContacts", contacts);

        if(!contacts) {
            console.log('No contacts');
            return;
        }

        let action = component.get("c.getContactsByIds");

        console.log("Contacts", contacts);
        console.log(Array.isArray(contacts));
        action.setParams({
            "contactIds" : contacts
        });

        action.setCallback(this, function(response) {
            let STATE = response.getState();

            if(STATE === "SUCCESS") {
                let result = response.getReturnValue();
                let count = result.length;

                if (count <= 30) {
                    helper.toast(component, "Selected Recipients", "You Selected " + result.length + " recipients", "success");    
                } else {
                    helper.toast(component, "Selected Recipients", "You Selected " + result.length + " recipients, be careful!", "warning");
                }

                component.set("v.contacts", result);
                console.log("Result from init ==> ", JSON.stringify(result));
            } else if (STATE === "ERROR") {
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

    },

    onChangeFolder: function (component, event, helper) {
        helper.setActiveFolder(component, helper, component.find("folderId").get("v.value"));
    },


    onChangeTemplate: function (component, event, helper) {
        helper.changeTemplate(component, helper);
    },

    searchField : function(component, event, helper) {
        let currentText = event.getSource().get("v.value");
        let resultBox = component.find('resultBox');

        component.set("v.LoadingText", true);
        if(currentText.length > 2) {
            $A.util.addClass(resultBox, 'slds-is-open');
        }
        else {
            $A.util.removeClass(resultBox, 'slds-is-open');
            return;
        }

        let contacts = component.get("v.contacts");
        let contactsId = [];

        contacts.forEach(contact => {
            if(contact.objectName === "Contact") { 
                contactsId.push(contact.recId);
            }
        });

        let action = component.get("c.getResults");
        action.setParams({
            "value" : currentText,
            "exclude" : contactsId
        });
        action.setCallback(this, function(response) {
            let STATE = response.getState();
            if(STATE === "SUCCESS") {
                let result = response.getReturnValue();
                component.set("v.searchRecords", result);
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
            component.set("v.LoadingText", false);
        });
        window.setTimeout($A.getCallback(function() {$A.enqueueAction(action);}), 500);
    },
    
    setSelectedRecord : function(component, event, helper) {
        let contactId = event.currentTarget.id;
        let resultBox = component.find('resultBox');
        $A.util.removeClass(resultBox, 'slds-is-open');
        // console.log("SEARCHED ==> ", component.get("v.searchRecords"));
        let contacts = component.get("v.contacts");
        console.log("test", JSON.stringify(event.currentTarget.dataset.name));

        if (event.currentTarget.dataset.objectName === "ListView") {
            helper.toast(component, "List View Recipients", "You are selecting recipients from " 
                + event.currentTarget.dataset.name + " List View, be careful!", "warning");
        }

        contacts.push({
            recName: event.currentTarget.dataset.name,
            recId: contactId,
            objectName: event.currentTarget.dataset.objectName
        });

        component.set("v.contacts", contacts);
        //component.set("v.recipients", contacts);

        let searchRecords = component.get("v.searchRecords");

        for(let i = 0; i < searchRecords.length; i++) {
            if(searchRecords[i].recId === contactId) {
                searchRecords.splice(i, 1);
                component.set("v.searchRecords", searchRecords);
                return;
            }
        }        
    },
    
    openInsertTemplateModal : function(component, event, helper) {
        helper.getTemplateFolders(component, helper);
        component.set("v.isTemplateModalOpen", true);
    },

    closeTemplatesModal : function(component, event, helper) {
        component.set("v.isTemplateModalOpen", false);
    },

    openMergeFieldsModal : function(component, event, helper) {
        component.set('v.isMergeModalOpen', true);
    },

    insertMergedFiled : function(component, event, helper) {
        let field = component.get("v.mergedField");

        if(field) {
            let emailBody = component.get("v.emailBody");
            let newBody;
            if(emailBody) {
                newBody = emailBody + " {!Contact." + field + "}";
            } else {
                newBody = "{!Contact." + field + "}";
            }
            component.set("v.emailBody", newBody);
            component.set("v.mergedField", null);
        }
    },

    handleRemoveContact : function(component, event, helper) {
        let contacts = component.get("v.contacts");
        let contactId = event.getSource().get("v.name");
        let newContact;
        let listName;
        //console.log(contactId);
        newContact = contacts.filter(contact => contact.recId != contactId);

        if (!contactId.startsWith("003")) {
            contacts.forEach(function(contact) {
                if(contact.recId === contactId) {
                    listName = contact.recName;
                }
            });
            let listViews = component.get("v.listViewContacts");
            console.log('old listviews =>', listViews);
            // component.set("v.listViewContacts", null);
            // console.log("listViewContacts: ", JSON.stringify(listViews));
            // console.log(listViews instanceof Map);
            
            let map = [];
            listViews.forEach(function(current) {
                console.log("Current element.key = ", current.key);
                if (current.key != listName) {
                    map.push({
                        key: current.key,
                        value: current.value
                    });
                    // map.set(current.key, current.value);
                }
            })

            console.log("New map: " + JSON.stringify(map));

            // for(let key in listViews) {
            //     console.log("FROM MAPFOREACH KEEY === ", key);
            //     if (key === listName) {
            //         listViews.delete(key);
            //     }
            // }
            // debugger;
            component.set("v.listViewContacts", map);
        }
        
        //console.log(newContact);
        component.set("v.contacts", newContact);
        component.set("v.contactsCopy", newContact);
    },

    contactsChange : function(component, event, helper) {
        console.log("CONTACTS ATTRIBUTE HAS CHANGED");
        let contacts = component.get("v.contacts");
        let oldContacts = component.get("v.contactsCopy");
        component.set('v.contactsCopy', contacts);
        let current;
        
        console.log("oldValue = " + oldContacts.length);
        console.log("newValue = " + contacts.length);
        // console.log("current contacts = " + contacts.length);
        
        if(oldContacts.length >= contacts.length) {
            console.log("RETURN");
            return;
        }

        //if (contacts.length > 0 && contacts.length <= event.getParam("oldValue").length) {
            current = contacts[contacts.length - 1];
            console.log("Current: " + current);
        //}
        
        let lwContacts = [];

        if(current.objectName === "ListView") {
            lwContacts.push(current);

            let action = component.get("c.getContactsFromListView");
            let requestParam = JSON.stringify(lwContacts);
            
            action.setParams({
                "listView" : requestParam
            });

            action.setCallback(this, function(response) {
                let STATE = response.getState();
                console.log("State: " + STATE);
                if(STATE === "SUCCESS") {
                    let result = response.getReturnValue();
                    let map = component.get("v.listViewContacts");

                    // console.log("Return value: ", result);
                    // console.log("Map BEFORE OPERATION: " + map);
                    // console.log("ONE MORE");
                    
                    for(let key in result) {
                        console.log("INSIDE");
                        console.log(key + ": " + result[key]);
                        if(map) {
                            console.log("INSIDE exist");
                            map.push({
                                key: key,
                                value: result[key]
                            });
                        } else {
                            map = new Map([
                                [key, result[key]]
                            ]);
                        }
                    }
                    console.log("OUTSIDE");
                    
                    if(!map) {
                        map = new Map();
                    }
                    
                    for(let key in result) {
                        map[key] = result[key];
                        // map.set(key, result[key]);
                    }
                    
                    console.log("BEFORE MAP SET ", JSON.stringify(map));
                    component.set("v.listViewContacts", map);
                    console.log("AFTER SET MAP: ", JSON.stringify(component.get("v.listViewContacts")));
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
        }
    },

    setPreviewBody : function(component, event, helper) {
        let contactId = event.currentTarget.id;
        let emailBody = component.get("v.emailBody");
        let newElements = Array.from(document.getElementsByClassName(contactId));
        let selectedContact = component.get("v.selectedContact");

        if(selectedContact) {
            let elements = Array.from(document.getElementsByClassName(selectedContact));
            if(Array.isArray(elements)) {
                elements.forEach(element => {
                    element.classList.remove("slds-text-title_bold");                    
                });
            } else {
                elements.classList.remove("slds-text-title_bold");
            }
        }
        
        if(Array.isArray(newElements)) {
            newElements.forEach(el => {
                el.classList.add("slds-text-title_bold");
            });
        } else {
            newElements.classList.add("slds-text-title_bold");
        }
        
        component.set("v.selectedContact", contactId);

        let action = component.get("c.mergeTemplate");

        action.setParams({
            "contactId" : contactId,
            "emailBody" : emailBody
        });

        action.setCallback(this, function(response) {
            let STATE = response.getState();

            if (STATE === "SUCCESS") {
                let result = response.getReturnValue();
                component.set("v.mergedEmailBody", result);
            }
            else if (STATE === "ERROR") {
                let errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });
        
        $A.enqueueAction(action);
    },

    confirmTemplate : function(component, event, helper) {
        let template = component.get("v.activeTemplate");
        console.log("templateId == ", template.id);

        component.set("v.emailSubject", template.subject);
        component.set("v.emailBody", template.body);

        component.set("v.isTemplateModalOpen", false);
    },

    handleUploadFinished : function (component, event) {
        let oldFiles = component.get("v.files");
        let files = event.getParam("files");

        if(oldFiles) {
            files.forEach(file => oldFiles.push(file));
        } else {
            oldFiles = files;
        }

        console.log("FILES == ", JSON.stringify(oldFiles));

        component.set("v.files", oldFiles);
    },
    
    handleRemoveFile : function(component, event, helper) {
        let fileId = event.getSource().get("v.name");
        let files = component.get("v.files");
        let newFiles = [];

        files.forEach(function(file) {
            if(file.documentId != fileId) {
                newFiles.push(file);
            }
        });

        component.set("v.files", newFiles);
    },

    openFileModal : function(component, event, helper) {
        component.set("v.isFileModalOpen", true);
    },

    closeFileModal : function(component, event, helper) {
        component.set("v.isFileModalOpen", false);
    }, 

    scheduleCloseModal : function(component, event, helper) {
        component.set("v.isScheduleModalOpen", false);
    },

    sendEmail : function(component, event, helper) {
        let allContacts = [];
        let recipients = component.get("v.contacts");

        console.log("Recipients: " + recipients);

        recipients.forEach(function(contact) {
            if(contact.objectName === "Contact") {
                allContacts.push(contact.recId);
            }
        });

        console.log("Contacts set = ", JSON.stringify(allContacts));
        
        let lwRecipients = component.get("v.listViewContacts");

        console.log("LwRecipients = ", JSON.stringify(lwRecipients));

        if(lwRecipients) {
            for(let current of lwRecipients.values()) {
                current.value.forEach(function(el) {
                    allContacts.push(el.Id);
                });
            }
        }

        let set = new Set(allContacts);

        let emailBody = component.get("v.emailBody");
        console.log("EMAIL BODY BEFORE EDIT ++++++++ ", emailBody);
        
        emailBody = emailBody.replace(/<p><br><\/p>/g, "<br>");
        emailBody = emailBody.replace(/<p>/g, "");
        emailBody = emailBody.replace(/<\/p>/g, "<br>");
        
        emailBody = emailBody.replace("testing123", "<a href=\"google.com\">testova linka<\/a>");
        
        
        console.log("EMAIL BODY === ", emailBody);
        let emailSubject = component.get("v.emailSubject");

        let hasError = false;

        if(set.size === 0) {
            helper.toast(component, "Email cannot be sent", "You have to select email recipients!", "error");
            hasError = true;
        } else if(!emailBody) {
            helper.toast(component, "Email cannot be sent", "Email body cannot be empty!", "error");
            hasError = true;
        } else if (!emailSubject) {
            helper.toast(component, "Email cannot be sent", "Email subject cannot be empty!", "error");
            hasError = true;
        }
        if(hasError) {
            return;
        }
        
        console.log("all contacts", set);

        let files = component.get("v.files");
        let fileList = [];

        if (files) {
            files.forEach(function(file) {
                fileList.push(file.contentVersionId);
            });
        }

        let action = component.get("c.sendEmails");
        console.log("Files = " + files);
        console.log("File List: " + fileList);

        action.setParams({
            "contactIds" : Array.from(set),
            "emailSubject" : emailSubject,
            "emailBody" : emailBody,
            "attachments" : fileList
        });

        action.setCallback(this, function(response) {
            let STATE = response.getState();

            if (STATE === "SUCCESS") {
                helper.toast(component, "Success", "Emails were successfully sent!", "success");
                component.set("v.emailBody", null);
                component.set("v.emailSubject", null);
                component.set("v.files", null);
                console.log("nulled");
            }
            else if (STATE === "ERROR") {
                let errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);
    },

    sendLater : function(component, event, helper) {
        component.set("v.isScheduleModalOpen", true);

        let recipients = component.get("v.contacts");
        let emailBody = component.get("v.emailBody");
        let emailSubject = component.get("v.emailSubject");

        if(recipients.length === 0) {
            helper.toast(component, "You will not be able to schedule email", "You have to select email recipients!", "warning");
        } else if(!emailBody) {
            helper.toast(component, "You will not be able to schedule email", "Email body cannot be empty!", "warning");
        } else if (!emailSubject) {
            helper.toast(component, "You will not be able to schedule email", "Email subject cannot be empty!", "warning");
        }
    },

    submitScheduledEmail : function(component, event, helper) {
        helper.showSpinner(component);
        let scheduledDate = component.find("scheduledDate").get("v.value");
        let allContacts = [];
        let recipients = component.get("v.contacts");

        recipients.forEach(function(contact) {
            if(contact.objectName === "Contact") {
                allContacts.push(contact.recId);
            }
        });

        let lwRecipients = component.get("v.listViewContacts");

        if(lwRecipients) {
            for(let current of lwRecipients.values()) {
                current.value.forEach(function(el) {
                    allContacts.push(el.Id);
                });
            }
        }

        let set = new Set(allContacts);
        let emailBody = component.get("v.emailBody");
        let emailSubject = component.get("v.emailSubject");

        let hasError = false;

        if(set.size === 0) {
            helper.toast(component, "Email cannot be sent", "You have to select email recipients!", "error");
            hasError = true;
        } else if(!emailBody) {
            helper.toast(component, "Email cannot be sent", "Email body cannot be empty!", "error");
            hasError = true;
        } else if (!emailSubject) {
            helper.toast(component, "Email cannot be sent", "Email subject cannot be empty!", "error");
            hasError = true;
        } else if (!scheduledDate) {
            helper.toast(component, "Email cannot be scheduled", "Email date and time cannot be empty!", "error");
        }
        if(hasError) {
            helper.hideSpinner(component);
            return;
        }

        let files = component.get("v.files");
        let fileList = [];

        if (files) {
            files.forEach(function(file) {
                fileList.push(file.contentVersionId);
            });
        }

        let action = component.get("c.scheduleEmail");

        action.setParams({
            "emailDate" : scheduledDate,
            "contactIds" : Array.from(set),
            "emailSubject" : emailSubject,
            "emailBody" : emailBody,
            "files" : fileList
        });

        action.setCallback(this, function(response) {
            let STATE = response.getState();

            if (STATE === "SUCCESS") {
                helper.hideSpinner(component);

                let result = response.getReturnValue();
                console.log("Result from server = " + result);

                if(result.startsWith("Successfully")) {
                    helper.toast(component, "Success", result, "success");
                } else {
                    helper.toast(component, "Error", result, "error");
                }
            } else if (STATE === "ERROR") {
                helper.hideSpinner(component);

                let errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
            component.set("v.isScheduleModalOpen", false);
        });
        $A.enqueueAction(action);
    }
})