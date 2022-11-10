global without sharing class BounceEmailBatchScheduler implements Schedulable {
  global void execute(SchedulableContext sc) {
    Database.executeBatch(new BounceEmailBatch(), 200);
  }
}