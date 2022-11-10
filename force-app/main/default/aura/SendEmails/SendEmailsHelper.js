({
    callBackendAction: function (cmp, actionName, params) {
        let that = this;
        return new Promise($A.getCallback(function (resolve, reject) {
          let action = cmp.get(actionName);
          if(!action && cmp.get('v.hasLoaded')) {
            reject('Cannot get action handler');
          }
          if(action) {
            if (params) {
              action.setParams(params);
            }
            action.setCallback(that, function (response) {
              let state = response.getState();
              if (cmp.isValid() && state === "SUCCESS") {
                resolve(response.getReturnValue());
              } else {
                if(response.getError()[0].message) {
                  reject(response.getError()[0].message);
                }
                else {
                  reject(response.getError()[0].pageErrors[0].message);
                }
              }
            });
            $A.enqueueAction(action);
          }
        }));
    },

    setActiveFolder: function (component, helper, folderIndex) {
        let folders = component.get("v.templateFolders")
        const params = {
            folderName: folders[folderIndex]
        }
        console.log('folder name =>', folders[folderIndex]);
        return new Promise($A.getCallback(function (resolve, reject) {
            helper.callBackendAction(component, "c.getTemplatesFromFolder", params)
                .then(function (result) {
                    console.log(result)
                    let templates = [];
                    result.forEach(el => templates.push({
                        htmlValue: el.HtmlValue,
                        body: el.Body,
                        name: el.Name,
                        id: el.Id,
                        subject: el.Subject,
                    }));
                    
                    templates.forEach(function (template) {
                        let newBody = template.body.replace(/\n/g, "<br>");
                        newBody = newBody.replace(/\r/g, "");
                        //newBody = newBody.replace(/<br><br>/g, "<br>");
                        template.body = newBody;
                        //replace(/(?:\\[rn])+/g, "<br>");
                    });

                    component.set("v.activeFolder", templates);
                    console.log('active folder = ', component.get("v.activeFolder"));
                    component.set("v.activeTemplate", templates[0]);
                    resolve(templates);
                });
        }))
    },

    changeTemplate: function (component, helper) {
        let index = component.find("templateId").get("v.value");
        let folder = component.get("v.activeFolder");
        console.log('active folder = ', component.get("v.activeFolder"));
        component.set("v.activeTemplate", folder[index]);
    },

    getTemplateFolders: function (component, helper) {
        return new Promise($A.getCallback(function (resolve, reject) {
            helper.callBackendAction(component, "c.getEmailTemplateFolders")
                .then(function (result) {
                    component.set("v.templateFolders", result);
                    let index = result.findIndex(el => el === "Architectural Sales Templates");
                    index = index === -1 ? 0 : index;
                    component.find('folderId').set('v.value', index);
                    helper.setActiveFolder(component, helper, index);
                    resolve(result);
                })
        }));
    },

    toast : function(component, title, message, variant) {
      component.find('notifLib').showToast({
        "title": title,
        "variant": variant,
        "message": message
      });
    },

    showSpinner: function(component) {
      component.set("v.spinner", true);
    },

    hideSpinner: function(component) {
      component.set("v.spinner", false);
    }
})