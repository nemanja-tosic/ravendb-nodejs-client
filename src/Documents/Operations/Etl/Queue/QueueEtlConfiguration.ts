import { EtlConfiguration } from "../EtlConfiguration";
import { EtlType, QueueBrokerType, QueueConnectionString } from "../ConnectionString";
import { EtlQueue } from "./EtlQueue";

export class QueueEtlConfiguration extends EtlConfiguration<QueueConnectionString> {
    public queues: EtlQueue[];
    public brokerType: QueueBrokerType;
    public skipAutomaticQueueDeclaration: boolean;

    public etlType: EtlType = "Queue";
}
