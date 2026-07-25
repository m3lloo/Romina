"""Message storage backed by Supabase."""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class MessageStoreError(RuntimeError):
    """Raised when the message backend cannot complete a request."""


class MessageStore:
    def __init__(
        self,
        supabase_url: str | None,
        supabase_key: str | None,
        supabase_service_key: str | None = None,
    ) -> None:
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.supabase_service_key = supabase_service_key
        self._client = None
        self._admin_client = None

    @property
    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)

    def _build_client(self, key: str):
        try:
            from supabase import create_client
        except ImportError as exc:
            raise MessageStoreError(
                "Supabase dependency is not installed") from exc

        return create_client(self.supabase_url, key)

    def _get_client(self):
        """Client for reads, using the public anon key.

        This respects row-level security, so it only ever sees whatever
        rows your SELECT policy exposes (e.g. approved = true).
        """
        if not self.is_configured:
            raise MessageStoreError("Supabase not configured")

        if self._client is None:
            self._client = self._build_client(self.supabase_key)

        return self._client

    def _get_write_client(self):
        """Client for writes.

        Inserts need elevated privileges: the anon key can't write
        unless you've also added an INSERT policy for the messages
        table. The service role key bypasses RLS entirely, so we use
        it here when it's configured. This is safe because MessageStore
        only ever runs on the server - this key is never sent to the
        browser. Falls back to the anon key if no service key is set,
        which only works if you've added an INSERT policy yourself.
        """
        if not self.is_configured:
            raise MessageStoreError("Supabase not configured")

        if self.supabase_service_key:
            if self._admin_client is None:
                logger.info("MessageStore: writing with the service role key.")
                self._admin_client = self._build_client(
                    self.supabase_service_key)
            return self._admin_client

        logger.warning(
            "MessageStore: SUPABASE_SERVICE_KEY is not set, so writes are "
            "falling back to the anon key. This will fail with a row-level "
            "security error unless you've added an INSERT policy on the "
            "messages table."
        )
        return self._get_client()

    def list_approved(self) -> list[dict[str, Any]]:
        try:
            response = (
                self._get_client()
                .table("messages")
                .select("*")
                .eq("approved", True)
                .order("created_at", desc=True)
                .execute()
            )
        except Exception as exc:
            raise MessageStoreError("Could not fetch messages") from exc

        return response.data or []

    def create(self, sender_name: str, message: str, approved: bool) -> dict[str, Any]:
        try:
            response = (
                self._get_write_client()
                .table("messages")
                .insert(
                    {
                        "sender_name": sender_name,
                        "message": message,
                        "approved": approved,
                    }
                )
                .execute()
            )
        except Exception as exc:
            raise MessageStoreError(
                f"Could not submit message: {exc}") from exc

        if not response.data:
            raise MessageStoreError("Message backend returned no data")

        return response.data[0]
