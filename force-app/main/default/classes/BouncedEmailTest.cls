@isTest
public with sharing class BouncedEmailTest {
  @testSetup
  static void setup() {
    Account acc = new Account(
      Name = 'Sample Account',
      RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName()
        .get('Lever_s_Partners')
        .getRecordTypeId()
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
  static void testBounceEmails() {
    Test.startTest();
    BounceEmailBatchScheduler myClass = new BounceEmailBatchScheduler();
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
  static void testBounceEmailBatch() {
    Test.startTest();
    Database.executeBatch(new BounceEmailBatch(), 200);
    Test.stopTest();
    Contact c = [
      SELECT Id, Email, IsEmailBounced, BounceEmailAddress__c
      FROM Contact
    ];
    System.assertEquals(c.Email, null, 'email must be empty.');
    System.assertEquals(
      c.BounceEmailAddress__c,
      'test@test.com',
      'bounced email address must be test@test.com'
    );
  }
}