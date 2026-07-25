# Birthday Greeting Site

A private birthday greeting page built with Flask, HTML, CSS, and JavaScript.
The app includes a countdown gate, a hidden main greeting page, a message wall,
and a romantic photo/memory section.

## Project Structure

```text
Romina/
|-- app.py
|-- requirements.txt
|-- .env.example
|-- services/
|   |-- __init__.py
|   `-- messages.py
|-- templates/
|   |-- countdown.html
|   |-- greet.html
|   `-- index.html
`-- static/
    |-- css/
    |   `-- style.css
    |-- js/
    |   |-- countdown.js
    |   |-- effects.js
    |   |-- greet.js
    |   `-- script.js
    |-- images/
    `-- music/
        `-- enchanted.mp3
```

## How To Run

1. Install Python 3.11+.
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and fill in your values.
4. Start the app:

   ```bash
   python app.py
   ```

5. Open `http://127.0.0.1:5000`.

## How the App Works

- `/` is the private greeting page.
- `/greet` is the public guestbook page where friends can leave birthday messages.
- Access to `/` is granted when the correct `ROMAIGNE_ACCESS_KEY` is provided in the URL.
- The page unlocks automatically on the configured birthday date.

## Customization

Edit `app.py` to personalize the greeting and content:

- `CONFIG["birthday_person"]` sets who the page is for.
- `CONFIG["sender_name"]` sets the signature of the note.
- `CONFIG["birthday_note"]` sets the main message text.
- `CONFIG["eras"]` controls the timeline/story sections.
- `CONFIG["photos"]` controls the photos and captions.
- `CONFIG["playlist"]` controls the music track.
- `WISHES` controls the random wish text shown on the guestbook page.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
APP_TIMEZONE=Asia/Manila
TARGET_DATE_LABEL=July 26th
FLASK_DEBUG=1
AUTO_APPROVE_MESSAGES=1
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=
ROMAIGNE_ACCESS_KEY=pick-a-long-random-string-here
FLASK_SECRET_KEY=another-long-random-string
```

- `AUTO_APPROVE_MESSAGES=1` publishes every new message immediately.
- `ROMAIGNE_ACCESS_KEY` is the private unlock key for the main birthday page.
- `FLASK_SECRET_KEY` should be a fixed secret in production.

## Notes

- Keep `.env` local and do not commit it to Git.
- `venv/` should be excluded from version control.
- If you use Supabase, configure a `messages` table and row-level security as needed.
