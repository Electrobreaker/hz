@isTest
public class SendEmailControllerTest {

    @isTest
    public static Void shouldTestController() {
        Account newAccount = new Account(Name = 'new');
        insert newAccount;

        Contact exclude = new Contact(FirstName = 'Abs', LastName = 'Cfd', AccountId = newAccount.Id);
        Contact myCon = new Contact(FirstName = 'All', LastName = 'Test', AccountId = newAccount.Id, Email = 'test@example.com');
        
        insert myCon;
        insert exclude;

        
        new SendEmailController.Field('', '');

        ListView lv = [SELECT Id, Name FROM ListView WHERE sObjectType = 'Contact' LIMIT 1];
        List<SendEmailController.SObjectResult> sor = new SendEmailController.SObjectResult[] {new SendEmailController.SObjectResult('', lv.Id)};

        SendEmailController.getContactsFromListView(JSON.serialize(sor));
        SendEmailController.getContactFields();
        SendEmailController.getTemplatesFromFolder(SendEmailController.getEmailTemplateFolders()[0]);
        SendEmailController.mergeTemplate(myCon.Id, 'test');
        SendEmailController.sendEmails(new String[]{myCon.Id}, 'test', 'test', new String[]{});
        SendEmailController.scheduleEmail(DateTime.now(), new String[]{myCon.Id}, 'sub', 'body', new String[]{'(' + myCon.Id, myCon.Id + ')'});
        SendEmailController.getContactsByIds(myCon.Id + ', ' + exclude.Id);
        new VFC_ProcessContactRecords();

        System.AssertNotEquals(SendEmailController.getResults('All', new String[]{exclude.Id}), null);

    }
}