import { EtlConfiguration } from "../EtlConfiguration";
import { EtlType, OlapConnectionString } from "../ConnectionString";
import { OlapEtlFileFormat } from "./OlapEtlFileFormat";
import { OlapEtlTable } from "./OlapEtlTable";

export class OlapEtlConfiguration extends EtlConfiguration<OlapConnectionString> {
    public runFrequency: string;
    public format: OlapEtlFileFormat;
    public customPartitionValue: string;
    public olapTables: OlapEtlTable[];

    public etlType: EtlType = "Olap";
}
