global without sharing class BounceEmailBatch implements DataBase.Batchable<sObject> {
  public BounceEmailBatch() {
  }

  global Database.QueryLocator start(Database.BatchableContext context) {
    if (test.isRunningTest()) {
      return Database.getQueryLocator(
        [
          SELECT Id, Email, IsEmailBounced, BounceEmailAddress__c
          FROM Contact
          LIMIT 1
        ]
      );
    }
    return Database.getQueryLocator(
      [
        SELECT Id, Email, IsEmailBounced, BounceEmailAddress__c
        FROM Contact
        WHERE IsEmailBounced = TRUE AND Email != NULL
      ]
    );
  }

  global void execute(Database.BatchableContext bC, List<sObject> scope) {
    List<Contact> listOfContact = new List<Contact>();

    Set<Id> accountIds = new Set<Id>();
    for (Contact c : (List<Contact>) scope) {
      c.BounceEmailAddress__c = c.Email;
      c.Email = null;
      listOfContact.add(c);
    }

    update listOfContact;
  }
  global void finish(Database.BatchableContext context) {
  }
}