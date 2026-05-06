"""
QuoteStatus type tests

Verify that QuoteStatus includes all backend-supported statuses.
"""

from typing import get_args

from turbodocx_sdk.types.quote_shared import QuoteStatus


EXPECTED_STATUSES = {"draft", "pending_approval", "sent", "accepted", "declined", "voided"}


class TestQuoteStatus:
    """Verify QuoteStatus Literal includes all backend statuses"""

    def test_pending_approval_is_valid_status(self):
        """pending_approval must be a member of QuoteStatus"""
        actual = set(get_args(QuoteStatus))
        assert "pending_approval" in actual, (
            f"'pending_approval' missing from QuoteStatus. Got: {actual}"
        )

    def test_all_backend_statuses_present(self):
        """QuoteStatus must include every status the backend supports"""
        actual = set(get_args(QuoteStatus))
        missing = EXPECTED_STATUSES - actual
        assert not missing, f"QuoteStatus is missing statuses: {missing}"

    def test_no_unexpected_statuses(self):
        """QuoteStatus should not contain statuses unknown to the backend"""
        actual = set(get_args(QuoteStatus))
        extra = actual - EXPECTED_STATUSES
        assert not extra, f"QuoteStatus has unexpected statuses: {extra}"
