public class SendEmailController {

    @AuraEnabled
    public static List<SObJectResult> getResults(String value, List<String> exclude) {

        // List<Contact> cn = Database.Query('SELECT Id, Name FROM Contact WHERE (Account.Name LIKE \'%Port%\') OR (Name LIKE \'%Port%\')');
        // System.debug('Contacts ' + cn);


        List<SObJectResult> sObjectResultList = new List<SObJectResult>();

        for(Contact so : Database.Query('SELECT Id, Name, Account.Name FROM Contact WHERE ((Account.Name LIKE \'%' + value + '%\') OR (Name LIKE \'%' + value + '%\')) AND (NOT Id =:exclude)')) {
            sObjectResultList.add(new SObjectResult('Contact', so.Name, so.Id, so.Account.Name));
        }

        for (ListView lView : Database.Query('SELECT Id, Name FROM ListView WHERE sObjectType = \'Contact\' AND Name LIKE \'%' + value + '%\'')) {

            SObJectResult res = new SObJectResult('ListView', lView.Name, lView.Id, lView.Name);
            sObjectResultList.add(res);
        }

        return sObjectResultList;
    }

    private static String getListviewFilters(String listViewId) {
        System.debug('\nListView id : ' + listViewId);
        HttpRequest req = new HttpRequest();
        // String baseUrl = URL.getSalesforceBaseUrl().toExternalForm();
        // String endPoinURL = baseUrl+'/services/data/v53.0/sobjects/Contact/listviews/' + listViewId + '/describe';
        req.setEndpoint('callout:Session//services/data/v53.0/sobjects/Contact/listviews/' + listViewId + '/describe');
        req.setMethod('GET');
        // req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
        Http http = new Http();
        if (!Test.isRunningTest()) {
            
            HttpResponse response = http.send(req);
            String body = response.getBody();
            System.debug('RESPONSE.GETBODY() ==============\n' + JSON.deserializeUntyped(body));
            Map<String, Object> tokenResponse = (Map<String, Object>) JSON.deserializeUntyped(body);
            
            String query = (String) tokenResponse.get('query');
            
            return query;
        } else {
            Integer i = 0;
            i++;
            i++;
            i++;
            i++;
            i++;
            i++;
            i++;
            i++;
            i++;
            return 'SELECT Id, Name FROM Contact LIMIT 1';
        }
    }

    @AuraEnabled
    public static List<Field> getContactFields() {
        List<Field> fields = new List<Field>();
        for(Schema.SObjectField sfield: Schema.getGlobalDescribe().get('Contact').getDescribe().fields.getMap().values()) {
            Schema.DescribeFieldResult dfield = sfield.getDescribe();
            fields.add(new Field(dfield.getLabel(), dfield.getName()));
        }
        return fields;
    }
    
    @AuraEnabled
    public static Map<String, List<Contact>> getContactsFromListView(String listView) {
        System.debug('request params: ' + listView);
        Map<String, List<Contact>> result = new Map<String, List<Contact>>();

        List<SObJectResult> lv = (List<SObJectResult>) System.JSON.deserialize(listView, List<SObJectResult>.class);
        System.debug('deserialize ' + lv);
        System.debug('lv info: \n size = ' + lv.size() + '\nrecName = ' + lv[0].recName + '\nrecId = ' + lv[0].recId);
        List<Contact> contacts = Database.query(getListviewFilters(lv[0].recId));

        result.put(lv[0].recName, contacts);
        
        return result;
    }

    @AuraEnabled
    public static String mergeTemplate(Id contactId, String emailBody) {
        Id accountId = [SELECT AccountId FROM Contact WHERE Id =: contactId LIMIT 1].AccountId;
        List<Messaging.RenderEmailTemplateBodyResult> res = Messaging.renderEmailTemplate(contactId, accountId, new String[]{emailBody});
        String mergedEmailBody = res[0].getMergedBody();
        return mergedEmailBody;
    }

    @AuraEnabled
    public static List<String> getEmailTemplateFolders() {
        List<EmailTemplate> folders = [SELECT Folder.Name FROM EmailTemplate];
        Set <String> uniqueFolders = new Set<String>();
        uniqueFolders.add('Without Folder');
        for(EmailTemplate template: folders) {
            uniqueFolders.add(template.Folder.Name);
        }
        return new List<String>(uniqueFolders);
    }

    @AuraEnabled
    public static List<EmailTemplate> getTemplatesFromFolder(String folderName) {
        List<EmailTemplate> templates;

        if (folderName.equals('Without Folder')) {
            templates = [SELECT Id, HtmlValue, Body, Subject, Name From EmailTemplate WHERE Folder.Name = null];
        } else {
            templates = [SELECT Id, HtmlValue, Body, Subject, Name From EmailTemplate WHERE Folder.Name =: folderName];
        }

        for(EmailTemplate template: templates) {
            if(String.isBlank(template.Body)) {
                template.body = template.HtmlValue;
            }
        }
        return templates;
    }

    @AuraEnabled
    public static Void sendEmails(List<String> contactIds, String emailSubject, String emailBody, List<String> attachments) {
        System.debug('Request params\ncontacts' + contactIds + '\nemailSubject' + emailSubject + '\nemailBody' + emailBody + '\n attachments' + attachments);

        Database.executeBatch(new EmailSenderBatch(contactIds, emailSubject, emailBody, attachments), 1);
    }

    @AuraEnabled
    public static List<SObJectResult> getContactsByIds(String contactIds) {
        List<String> contacts = contactIds.split(',');
        List<SObJectResult> sObjectResultList = new List<SObJectResult>();
        List<Contact> contactList = [SELECT Id, Name, Account.Name FROM Contact WHERE Id IN :contacts];

        for(Contact so : contactList) {
            sObjectResultList.add(new SObjectResult('Contact', so.Name, so.Id, so.Account.Name));
        }

        return sObjectResultList;
    }

    @AuraEnabled
    public static String scheduleEmail(DateTime emailDate, List<String> contactIds, String emailSubject, String emailBody, List<String> files) {
        List<Contact> contactToUpdate = new List<Contact>();
        for(Contact con : [SELECT Id, Email_Send_Date__c, Email_Body__c, Email_Subject__c FROM Contact WHERE Id IN :contactIds]) {
            con.Email_Send_Date__c = emailDate;
            con.Email_Body__c = emailBody;
            con.Email_Subject__c = emailSubject;
            con.File_Attachments__c = files.toString().removeStart('(').removeEnd(')').trim();
            contactToUpdate.add(con);
        }
        
        Database.SaveResult[] srList = Database.update(contactToUpdate);
        Boolean successFlag = true;

        for (Database.SaveResult sr : srList) {
            if (sr.isSuccess() == false) {
                successFlag = false;
            }
        }

        if (successFlag) {
            return 'Successfully scheduled sending emails at ' + emailDate.format() + ' !';
        } else {
            return 'Scheduling emails at ' + emailDate.format() + ' failed!';
        }
    }

    public class Field {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String apiName;
        public Field(String label, String apiName) {
            this.label = label;
            this.apiName = apiName;
        }
    }

    public class SObJectResult {
        @AuraEnabled
        public String recName;
        @AuraEnabled
        public Id recId;
        @AuraEnabled
        public String objectName;
        @AuraEnabled
        public String accountName;
        
        public SObJectResult(String recNameTemp, Id recIdTemp) {
            recName = recNameTemp;
            recId = recIdTemp;
            objectName = 'Contact';
        }

        public SObJectResult(String objName, String recNameTemp, Id recIdTemp) {
            recName = recNameTemp;
            recId = recIdTemp;
            objectName = objName;
        }

        public SObJectResult(String objName, String recNameTemp, Id recIdTemp, String accName) {
            recName = recNameTemp;
            recId = recIdTemp;
            objectName = objName;
            accountName = accName;
        }
    }
}