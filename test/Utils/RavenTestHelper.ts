import { GetIndexErrorsOperation, IDocumentStore } from "../../src";
import os from "node:os";
import { throwError } from "../../src/Exceptions";
import { StringBuilder } from "../../src/Utility/StringBuilder";

export class RavenTestHelper {
    public static async assertNoIndexErrors(store: IDocumentStore, databaseName?: string) {
        const errors = await store.maintenance.forDatabase(databaseName).send(new GetIndexErrorsOperation());

        let sb: StringBuilder;

        for (const indexErrors of errors) {
            if (!indexErrors || !indexErrors.errors || !indexErrors.errors.length) {
                continue;
            }

            if (!sb) {
                sb = new StringBuilder();
            }

            sb.append("Index Errors for '")
                .append(indexErrors.name)
                .append(" '(")
                .append(indexErrors.errors.length.toString())
                .append(")");
            sb.append(os.EOL);

            for (const indexError of indexErrors.errors) {
                sb.append("- " + indexError);
                sb.append(os.EOL);
            }

            sb.append(os.EOL);
        }

        if (!sb) {
            return;
        }

        throwError("InvalidOperationException", sb.toString());
    }
}
