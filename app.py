"""Romantic birthday page with a countdown gate and optional Supabase messages."""

from __future__ import annotations

import os
import random
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, render_template, request

from services.messages import MessageStore, MessageStoreError

load_dotenv()


# =====================================================================
# Site content and runtime settings
# (formerly app_config.py — merged in here since app.py was its only
# importer)
# =====================================================================

def load_timezone():
    try:
        return ZoneInfo(os.getenv("APP_TIMEZONE", "Asia/Manila"))
    except ZoneInfoNotFoundError:
        return timezone(timedelta(hours=8), name="UTC+08:00")


APP_TIMEZONE = load_timezone()

# The site celebrates this day every single year, not just once.
# Change these two numbers if her birthday isn't July 26th.
BIRTHDAY_MONTH = 7
BIRTHDAY_DAY = 26


def get_target_date(reference: datetime) -> datetime:
    """Return the start (00:00) of this year's birthday window.

    If this year's window has already fully passed (the day is over),
    roll over to next year's date instead — so the countdown keeps
    resetting itself, forever, with no code changes needed.
    """
    target = reference.replace(
        month=BIRTHDAY_MONTH,
        day=BIRTHDAY_DAY,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    if reference >= target + timedelta(days=1):
        target = target.replace(year=target.year + 1)
    return target


def is_birthday_now(reference: datetime) -> bool:
    """True for the entire calendar day of the birthday, every year."""
    target = get_target_date(reference)
    return target <= reference < target + timedelta(days=1)


@dataclass(frozen=True)
class Settings:
    debug: bool
    supabase_url: str | None
    supabase_key: str | None
    supabase_service_key: str | None
    auto_approve_messages: bool
    target_date_label: str
    access_key: str | None
    secret_key: str

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            debug=os.getenv("FLASK_DEBUG") == "1",
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY"),
            supabase_service_key=os.getenv("SUPABASE_SERVICE_KEY"),
            auto_approve_messages=os.getenv(
                "AUTO_APPROVE_MESSAGES", "1") == "1",
            target_date_label=os.getenv("TARGET_DATE_LABEL", "July 26th"),
            # This is the secret that unlocks the main site. Keep it out of
            # source control (.env only) and only ever share it embedded in
            # the private link below, never on its own.
            access_key=os.getenv("ROMAIGNE_ACCESS_KEY"),
            # Used to cryptographically sign the "I've unlocked this before"
            # cookie so it can't be faked or guessed. Set a fixed value in
            # .env in production, otherwise a new random one is generated
            # every restart and everyone gets logged out.
            secret_key=os.getenv("FLASK_SECRET_KEY") or os.urandom(32).hex(),
        )


CONFIG = {
    "birthday_person": "Romaigne",
    "sender_name": "Mello",
    "birthday_note": (
        "Happy birthday, Romaigne! It's your day, so enjoy it, you deserve all the love and happiness in this world. I hope you never change and never lose that smile on your face. Keep enjoying life the way you want it to be, and keep chasing your goals in life. I'll always be your number one supporter. Happy birthday again!"
    ),
    "eras": [
        {
            "tag": "Chapter I",
            "title": "The First Time",
            "text": "The moment our eyes met - not just a glance, but something deeper. That was the start of us wanting to know each other.",
        },
        {
            "tag": "Chapter II",
            "title": "Something Shifted",
            "text": "The in-between - when what we felt for each other started to grow, and we chose to nurture it a little more each day.",
        },
        {
            "tag": "Chapter III",
            "title": "Still Here",
            "text": "The chapter we haven't written yet, but one thing is certain - we're still here, still choosing this.",
        },
    ],
    "photos": [
        {"file": "photo1.jpg", "caption": "that graduation day"},
        {"file": "photo2.jpg", "caption": "just the collars, just the certainty"},
        {"file": "photo3.jpg", "caption": "my kiss, your reflection catching it"},
    ],
    "playlist": [
        {"title": "Enchanted", "artist": "Taylor Swift", "file": "enchanted.mp3"},
    ],
}

WISHES = [
    "May this year give you all the things you've been too shy to wish for.",
    "Here's to the moments that make you forget what you were even worried about.",
    "Wishing you a year of being seen, truly seen, by someone worth it.",
    "May something wonderful happen today that you almost don't believe.",
    "Here's to soft midnights, slow mornings, and everything in between.",
    "Wishing you a year where the right words find you at the right time.",
    "May this birthday be the beginning of your favorite chapter yet.",
    "Here's to you - exactly as you are, right now, in this moment.",
]


# =====================================================================
# Flask app
# =====================================================================

app = Flask(__name__)
settings = Settings.from_env()
app.secret_key = settings.secret_key

if not settings.access_key:
    app.logger.warning(
        "ROMAIGNE_ACCESS_KEY is not set — the main site at '/' will "
        "redirect everyone to /greet, since there's no key to unlock it "
        "with. Set ROMAIGNE_ACCESS_KEY in your .env to generate a private "
        "link like https://yourdomain.com/?key=<the-key>."
    )

messages = MessageStore(
    settings.supabase_url,
    settings.supabase_key,
    settings.supabase_service_key,
)


def has_site_access() -> bool:
    """True only when this exact request carries the correct ?key=...

    No session or cookie is used to "remember" a previous unlock — every
    visit is checked fresh. That means opening the bare domain (or an old
    bookmark without ?key=) always lands on /greet, even on a browser
    that has used the private link before.
    """
    return bool(settings.access_key) and request.args.get("key") == settings.access_key


def now_in_app_timezone() -> datetime:
    """Return the current time in the app's configured timezone."""
    return datetime.now(APP_TIMEZONE)


def is_unlocked() -> bool:
    """True for the whole calendar day of the birthday — every year."""
    return is_birthday_now(now_in_app_timezone())


@app.route("/")
def index():
    if not has_site_access():
        # No valid key/cookie: send them to the public guestbook page
        # instead of showing anything about the main site.
        return redirect("/greet")

    now = now_in_app_timezone()

    if not is_unlocked():
        target = get_target_date(now)
        return render_template(
            "countdown.html",
            birthday_person=CONFIG["birthday_person"],
            target_date_iso=target.isoformat(),
            target_date_label=settings.target_date_label,
        )

    return render_template("index.html", **CONFIG)


@app.route("/api/time-check")
def time_check():
    """Use the server clock as the countdown source of truth."""
    now = now_in_app_timezone()
    target = get_target_date(now)
    return jsonify(
        {
            "unlocked": is_birthday_now(now),
            "server_time": now.isoformat(),
            "target_time": target.isoformat(),
        }
    )


@app.route("/greet")
def greet():
    """Standalone page for friends to leave birthday messages."""
    return render_template("greet.html", birthday_person=CONFIG["birthday_person"])


@app.route("/api/wish")
def get_wish():
    return jsonify({"wish": random.choice(WISHES)})


@app.route("/api/messages", methods=["GET"])
def get_messages():
    if not messages.is_configured:
        return jsonify({"error": "Supabase not configured", "messages": []}), 200

    try:
        return jsonify({"messages": messages.list_approved()}), 200
    except MessageStoreError as exc:
        app.logger.exception("Error fetching messages")
        return jsonify({"error": str(exc), "messages": []}), 200


@app.route("/api/messages", methods=["POST"])
def submit_message():
    data = request.get_json(silent=True) or {}
    sender_name = str(data.get("sender_name")
                      or "Anonymous").strip() or "Anonymous"
    message_text = str(data.get("message") or "").strip()

    if len(message_text) < 5:
        return jsonify({"error": "Message too short"}), 400

    if len(message_text) > 500:
        return jsonify({"error": "Message too long"}), 400

    if len(sender_name) > 100:
        return jsonify({"error": "Name too long"}), 400

    if not messages.is_configured:
        return jsonify({"error": "Supabase not configured"}), 500

    try:
        message = messages.create(
            sender_name=sender_name,
            message=message_text,
            approved=settings.auto_approve_messages,
        )
        return jsonify({"success": True, "message": message}), 201
    except MessageStoreError as exc:
        app.logger.exception("Error submitting message")
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=settings.debug)
