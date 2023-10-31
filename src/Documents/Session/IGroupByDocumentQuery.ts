import { GroupByField } from "./GroupByField";
import { IDocumentQuery } from "./IDocumentQuery";
import { IFilterFactory } from "../Queries/IFilterFactory";

export interface IGroupByDocumentQuery<T extends object> {

    selectKey(): IGroupByDocumentQuery<T>;
    selectKey(fieldName: string): IGroupByDocumentQuery<T>;
    selectKey(fieldName: string, projectedName: string): IGroupByDocumentQuery<T>;

    selectSum(field: GroupByField, ...fields: GroupByField[]): IDocumentQuery<T>;

    selectCount(): IDocumentQuery<T>;
    selectCount(projectedName: string): IDocumentQuery<T>;

    filter(builder: (factory: IFilterFactory<T>) => void);
    filter(builder: (factory: IFilterFactory<T>) => void, limit: number);
}
