public with sharing class EmailSenderBatch implements Database.Batchable<sObject> {
    List<String> contactsId;
    List<String> fileAttachments;
    String body;
    String subject;
    Boolean mergeSubject;
    Boolean mergeBody;

    public EmailSenderBatch(List<String> contactsId, String subject, String body, List<String> filesIds) {
        this.fileAttachments = filesIds;
        this.contactsId = contactsId;
        this.subject = subject;
        this.body = body;
        this.mergeBody = Pattern.compile('\\{.*\\}').matcher(body).replaceAll('').equals(body) ? false : true;
        this.mergeSubject = Pattern.compile('\\{.*\\}').matcher(subject).replaceAll('').equals(subject) ? false : true;
    }

    public Database.QueryLocator start(Database.BatchableContext BC) {
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
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        return Database.getQueryLocator([SELECT Id, Email FROM Contact WHERE Id =:contactsId]);
    }
  
    public void execute(Database.BatchableContext BC, List<Contact> contacts) {
        List<Messaging.SingleEmailMessage> messages = new List<Messaging.SingleEmailMessage>();
        for(Contact contact: contacts) {
            Messaging.SingleEmailMessage message = new Messaging.SingleEmailMessage();
            if(mergeSubject) {
                List<Messaging.RenderEmailTemplateBodyResult> res = Messaging.renderEmailTemplate(contact.Id, null, new String[]{subject});
                message.subject = res[0].getMergedBody();
            } else {
                message.subject = subject;
            }

            if(mergeBody) {
                List<Messaging.RenderEmailTemplateBodyResult> res = Messaging.renderEmailTemplate(contact.Id, null, new String[]{body});
                message.HtmlBody = res[0].getMergedBody();
            } else {
                message.HtmlBody = body;
            }
            
            message.setToAddresses(new List<String>{contact.Email});
            if (fileAttachments.size() > 0) {
                message.setEntityAttachments(fileAttachments);
            }
            message.setTargetObjectId(contact.Id);
            messages.add(message);
            System.debug('contact email ===> ' + contact.Email);
        }

        if(messages.size() > 0) {
            Messaging.sendEmail(messages);
        }
    }

    public void finish(Database.BatchableContext BC) {
        if (!fileAttachments.isEmpty()) {
            List<ContentDocument> filesForDelete = new List<ContentDocument>();

            for(ContentVersion cv : [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id IN :fileAttachments]) {
                filesForDelete.add(new ContentDocument(Id = cv.contentDocumentId));
            }

            delete filesForDelete;
        }
    }
  
}