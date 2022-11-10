global with sharing class ListEmailBatchScheduler implements Schedulable {
  global void execute(SchedulableContext sc) {
    Database.executeBatch(new ListEmailBatch(), 200);
  }
}