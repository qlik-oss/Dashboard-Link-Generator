# Limitations
## Android/iOS clipboard
There is a known limitation with the clipboard API on iOS and Android devices. Resulting in it not been possible to directly copy to the clipboard.

**Expected**: The expected behaviour is that the link is copied to the clipboard.

**Actual**: The actual behaviour is that the link isn't copied, instead, the user needs to show the text field and manually copy the text.

## Selections with special characters
Has known issues handling selections with special characters.

**Expected**: Any selection done before link copy should be resolved when going to that url.

**Actual**: Selections matching `:`, `;` or `*` will be missing when resolving share url.
