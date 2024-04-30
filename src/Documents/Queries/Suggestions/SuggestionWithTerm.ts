import { SuggestionBase } from "./SuggestionBase.js";

export class SuggestionWithTerm extends SuggestionBase {
    public term: string;

    public constructor(field: string) {
        super(field);
    }
}
