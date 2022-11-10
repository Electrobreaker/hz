@isTest
public with sharing class ListEmailTest {
  @testSetup
  static void setup() {
    Account acc = new Account(
      Name = 'Sample Account',
      RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName()
        .get('Lever_s_Partners')
        .getRecordTypeId(),
      Account_Auto_process_Stage_of_Engagement__c = 'No reachouts to company'
    );
    insert acc;

    Contact c = new Contact(
      Firstname = 'Sample',
      LastName = 'Contact',
      Email = 'test@test.com',
      AccountId = acc.Id
    );
    insert c;
  }
  @isTest
  static void testListEmailScheduler() {
    Test.startTest();
    ListEmailBatchScheduler myClass = new ListEmailBatchScheduler();
    String chron = '0 0 23 * * ?';
    Id jobId = system.schedule('Test Sched', chron, myClass);
    Test.stopTest();
    List<AsyncApexJob> jobsScheduled = [
      SELECT Id, ApexClassID, ApexClass.Name, Status, JobType
      FROM AsyncApexJob
      WHERE JobType = 'ScheduledApex'
    ];
    System.assertEquals(1, jobsScheduled.size(), 'expecting one scheduled job');
  }

  @isTest
  static void testListEmailBatch() {
    Test.startTest();
    Database.executeBatch(new ListEmailBatch(), 200);
    Test.stopTest();
    Account acc = [
      SELECT Id, Account_Auto_process_Stage_of_Engagement__c
      FROM Account
    ];

    System.assertEquals(
      acc.Account_Auto_process_Stage_of_Engagement__c,
      'First Email Sent',
      'Stage of Engagement must be First Email Sent'
    );
  }
}