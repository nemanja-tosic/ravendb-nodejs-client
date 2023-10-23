import { EtlConfiguration } from "../EtlConfiguration";
import { ElasticSearchConnectionString, EtlType } from "../ConnectionString";
import { ElasticSearchIndex } from "./ElasticSearchIndex";

export class ElasticSearchEtlConfiguration extends EtlConfiguration<ElasticSearchConnectionString> {
    public elasticIndexes: ElasticSearchIndex[];

    public etlType: EtlType = "ElasticSearch";
}
