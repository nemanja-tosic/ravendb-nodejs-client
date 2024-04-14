
export class LengthUnawareFormData  {

    // node fetch doesn't support stream.Readable very well
    // so we force request length to be unterminated
    // as result we don't have to scan streams twice

    getLengthSync(): number {
        return undefined;
    }
}