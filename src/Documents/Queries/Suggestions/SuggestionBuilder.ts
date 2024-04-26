import { ISuggestionBuilder } from "./ISuggestionBuilder.js";
import { ISuggestionOperations } from "./ISuggestionOperations.js";
import { SuggestionWithTerm } from "./SuggestionWithTerm.js";
import { SuggestionWithTerms } from "./SuggestionWithTerms.js";
import { throwError } from "../../../Exceptions/index.js";
import { TypeUtil } from "../../../Utility/TypeUtil.js";
import { SuggestionOptions } from "./SuggestionOptions.js";
import { SuggestionBase } from "./SuggestionBase.js";
import { Field } from "../../../Types/index.js";

export class SuggestionBuilder<T> implements ISuggestionBuilder<T>, ISuggestionOperations<T> {

    private _term: SuggestionWithTerm;
    private _terms: SuggestionWithTerms;

    public withDisplayName(displayName: string): ISuggestionOperations<T> {
        this.suggestion.displayField = displayName;
        return this;
    }

    public byField(fieldName: Field<T>, term: string): ISuggestionOperations<T>;
    public byField(fieldName: Field<T>, terms: string[]): ISuggestionOperations<T>;
    public byField(fieldName: Field<T>, termOrTerms: string | string[]): ISuggestionOperations<T> {
        if (!fieldName) {
            throwError("InvalidArgumentException", "fieldName cannot be null");
        }

        if (!termOrTerms) {
            throwError("InvalidArgumentException", "term cannot be null");
        }

        if (TypeUtil.isArray(termOrTerms)) {
            if (!termOrTerms.length) {
                throwError("InvalidArgumentException", "Terms cannot be an empty collection");
            }

            this._terms = new SuggestionWithTerms(fieldName);
            this._terms.terms = termOrTerms;

        } else {
            this._term = new SuggestionWithTerm(fieldName);
            this._term.term = termOrTerms;
        }

        return this;
    }

    public withOptions(options: SuggestionOptions): ISuggestionOperations<T> {
        this.suggestion.options = options;

        return this;
    }

    public get suggestion(): SuggestionBase {
        if (this._term) {
            return this._term;
        }

        return this._terms;
    }
}
