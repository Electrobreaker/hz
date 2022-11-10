global without sharing class ListEmailBatch implements DataBase.Batchable<sObject> {
  public ListEmailBatch() {
  }

  global Database.QueryLocator start(Database.BatchableContext context) {
    if (test.isRunningTest()) {
      return Database.getQueryLocator(
        [SELECT Id, AccountId FROM Contact LIMIT 1]
      );
    }
    return Database.getQueryLocator(
      [
        SELECT Id, AccountId
        FROM Contact
        WHERE
          Account.Account_Auto_process_Stage_of_Engagement__c = 'No reachouts to company'
          AND Id IN (SELECT RecipientId FROM ListEmailIndividualRecipient)
      ]
    );
  }

  global void execute(Database.BatchableContext bC, List<sObject> scope) {
    Set<Id> accountIds = new Set<Id>();
    for (Contact c : (List<Contact>) scope) {
      accountIds.add(c.AccountId);
    }

    List<Account> toUpdate = new List<Account>();
    for (Account acc : [
      SELECT Id, Account_Auto_process_Stage_of_Engagement__c
      FROM Account
      WHERE
        Id IN :accountIds
        AND Account_Auto_process_Stage_of_Engagement__c = 'No reachouts to company'
    ]) {
      acc.Account_Auto_process_Stage_of_Engagement__c = 'First Email Sent';
      toUpdate.add(acc);
    }
    update toUpdate;
  }
  global void finish(Database.BatchableContext context) {
  }
}