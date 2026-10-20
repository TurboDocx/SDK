<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * How the embedded signing page shows its page navigation (the page-thumbnail rail and the
 * "Pages" button) when the signing URL is loaded in an iframe. Sent as `pageNavigation` by
 * `TurboSign::createSigningUrl()`.
 */
enum PageNavigation: string
{
    /**
     * The default. Sized to the iframe width: the thumbnail rail is open at 1200px and wider,
     * collapsed from 900px to 1199px, and a "Pages" button in the bottom bar under 900px.
     */
    case AUTO = 'auto';
    /** The rail starts collapsed at any width. The signer can still expand it. */
    case COLLAPSED = 'collapsed';
    /** No rail and no "Pages" button. */
    case HIDDEN = 'hidden';
}
